import { Transaction } from '@solana/web3.js';
import { getStatePDA } from './pda';
import { initializeInstruction } from './instructions';
import { confirmTransactionWithRetry } from './transactions';
import { readU64LE } from './buffer';

// Check if protocol is initialized
export const checkInitialization = async (
  connection,
  setInitialized,
  setTotalMarkets,
  log,
  displayMessage
) => {
  try {
    const statePda = getStatePDA();
    const accountInfo = await connection.getAccountInfo(statePda);
    
    if (accountInfo) {
      setInitialized(true);
      const totalMarketsCount = readU64LE(accountInfo.data, 8);
      setTotalMarkets(totalMarketsCount);
      log('SUCCESS', 'INIT', 'Protocol initialized', { totalMarkets: totalMarketsCount.toString() });
      displayMessage(`✅ Protocol ready | ${totalMarketsCount} markets`, 'success');
    } else {
      setInitialized(false);
      setTotalMarkets(0n);
      log('WARN', 'INIT', 'Protocol not initialized');
      displayMessage('⚠️ Protocol needs initialization', 'info');
    }
  } catch (error) {
    log('ERROR', 'INIT', 'Check failed', { error: error.message });
  }
};

// Handle protocol initialization
export const handleInitialize = async (
  wallet,
  connection,
  setLoading,
  setInitialized,
  setTotalMarkets,
  log,
  displayMessage
) => {
  if (!wallet.publicKey) {
    displayMessage('❌ Connect wallet first', 'error');
    return;
  }

  try {
    setLoading(true);
    displayMessage('🚀 Initializing protocol...', 'info');

    const statePda = getStatePDA();
    const instruction = initializeInstruction(statePda, wallet.publicKey);
    const transaction = new Transaction().add(instruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signature = await wallet.sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: 'finalized',
    });

    await confirmTransactionWithRetry(connection, signature, blockhash, lastValidBlockHeight, log);
    
    setInitialized(true);
    setTotalMarkets(0n);
    displayMessage('✅ Protocol initialized!', 'success');
    log('SUCCESS', 'TX', 'Initialized', { signature });
  } catch (error) {
    log('ERROR', 'TX', 'Initialize failed', { error: error.message });
    displayMessage(`❌ ${error.message || 'Initialization failed'}`, 'error');
  } finally {
    setLoading(false);
  }
};
