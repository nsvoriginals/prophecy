'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { sha256 } from 'js-sha256';

const PROGRAM_ID = new PublicKey('H6mwQUik2uuctEaBdfCtVfukqXYtQrX4MhWnsbkAQ1L9');

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [prediction, setPrediction] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'success', 'error', 'info'

  // Helper: Get Market PDA
  const getMarketPDA = (creatorPubkey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), creatorPubkey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  // Helper: Get UserBet PDA
  const getUserBetPDA = (marketPda, userPubkey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_bet'), marketPda.toBuffer(), userPubkey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  // Helper: Display message
  const displayMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  // CREATE MARKET INSTRUCTION
  const createMarketInstruction = (marketPda, creator, description, deadlineUnix) => {
    const discriminator = Buffer.from(sha256.digest('global:create_market')).subarray(0, 8);

    const descBytes = Buffer.from(description, 'utf8');
    const descLength = Buffer.alloc(4);
    descLength.writeUInt32LE(descBytes.length, 0);

    const deadlineBuffer = Buffer.alloc(8);
    const deadlineView = new DataView(deadlineBuffer.buffer);
    deadlineView.setBigInt64(0, BigInt(deadlineUnix), true);

    const data = Buffer.concat([discriminator, descLength, descBytes, deadlineBuffer]);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: marketPda, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  };

  // PLACE BET INSTRUCTION
  const placeBetInstruction = (marketPda, userBetPda, user, amountLamports, prediction) => {
    const discriminator = Buffer.from(sha256.digest('global:place_bet')).subarray(0, 8);

    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amountLamports), 0);

    const predictionBuffer = Buffer.from([prediction ? 1 : 0]);

    const data = Buffer.concat([discriminator, amountBuffer, predictionBuffer]);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: marketPda, isSigner: false, isWritable: true },
        { pubkey: userBetPda, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  };

  // SETTLE MARKET INSTRUCTION
  const settleMarketInstruction = (marketPda, creator, outcome) => {
    const discriminator = Buffer.from(sha256.digest('global:settle_market')).subarray(0, 8);
    const outcomeBuffer = Buffer.from([outcome ? 1 : 0]);
    const data = Buffer.concat([discriminator, outcomeBuffer]);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: marketPda, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: true, isWritable: false },
      ],
      data,
    });
  };

  // CLAIM WINNINGS INSTRUCTION
  const claimWinningsInstruction = (marketPda, userBetPda, user) => {
    const discriminator = Buffer.from(sha256.digest('global:claim_winnings')).subarray(0, 8);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: marketPda, isSigner: false, isWritable: true },
        { pubkey: userBetPda, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
      ],
      data: discriminator,
    });
  };

  // CREATE MARKET HANDLER
  const handleCreateMarket = async () => {
    if (!wallet.publicKey) {
      displayMessage('Please connect your wallet', 'error');
      return;
    }

    if (!description || !deadline) {
      displayMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Creating market...', 'info');

      const marketPda = getMarketPDA(wallet.publicKey);
      const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);

      const instruction = createMarketInstruction(
        marketPda,
        wallet.publicKey,
        description,
        deadlineUnix
      );

      const transaction = new Transaction().add(instruction);
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      displayMessage(`Market created successfully. Transaction: ${signature.substring(0, 8)}...`, 'success');
      console.log('Transaction:', signature);

      setDescription('');
      setDeadline('');
    } catch (error) {
      console.error('Error:', error);
      displayMessage(error.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // PLACE BET HANDLER
  const handlePlaceBet = async (marketCreator) => {
    if (!wallet.publicKey || !marketCreator || !betAmount) {
      displayMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Placing bet...', 'info');

      const creatorPubkey = new PublicKey(marketCreator);
      const marketPda = getMarketPDA(creatorPubkey);
      const userBetPda = getUserBetPDA(marketPda, wallet.publicKey);

      const amountLamports = Math.floor(parseFloat(betAmount) * LAMPORTS_PER_SOL);

      const instruction = placeBetInstruction(
        marketPda,
        userBetPda,
        wallet.publicKey,
        amountLamports,
        prediction
      );

      const transaction = new Transaction().add(instruction);
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      displayMessage(`Bet placed successfully. Transaction: ${signature.substring(0, 8)}...`, 'success');
      setBetAmount('');
    } catch (error) {
      console.error('Error:', error);
      displayMessage(error.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // SETTLE MARKET HANDLER
  const handleSettleMarket = async (outcome) => {
    if (!wallet.publicKey) {
      displayMessage('Please connect your wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Settling market...', 'info');

      const marketPda = getMarketPDA(wallet.publicKey);

      const instruction = settleMarketInstruction(marketPda, wallet.publicKey, outcome);

      const transaction = new Transaction().add(instruction);
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      displayMessage(
        `Market settled. Winner: ${outcome ? 'YES' : 'NO'}. Transaction: ${signature.substring(0, 8)}...`,
        'success'
      );
    } catch (error) {
      console.error('Error:', error);
      displayMessage(error.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // CLAIM WINNINGS HANDLER
  const handleClaimWinnings = async (marketCreator) => {
    if (!wallet.publicKey || !marketCreator) {
      displayMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Claiming winnings...', 'info');

      const creatorPubkey = new PublicKey(marketCreator);
      const marketPda = getMarketPDA(creatorPubkey);
      const userBetPda = getUserBetPDA(marketPda, wallet.publicKey);

      const instruction = claimWinningsInstruction(marketPda, userBetPda, wallet.publicKey);

      const transaction = new Transaction().add(instruction);
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      displayMessage(`Winnings claimed successfully. Transaction: ${signature.substring(0, 8)}...`, 'success');
    } catch (error) {
      console.error('Error:', error);
      displayMessage(error.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyles = () => {
    const baseStyles = 'mb-6 p-4 rounded-lg border';
    const typeStyles = {
      success: 'bg-green-500/20 border-green-500',
      error: 'bg-red-500/20 border-red-500',
      info: 'bg-blue-500/20 border-blue-500',
    };
    return `${baseStyles} ${typeStyles[messageType]}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Prophecy Protocol</h1>
          <WalletMultiButton />
        </div>

        {/* Wallet Status */}
        {wallet.publicKey && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-sm break-all">
              Connected: <span className="font-mono">{wallet.publicKey.toString()}</span>
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={getMessageStyles()}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Create Market */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <h2 className="text-2xl font-bold mb-4">Create Market</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Description (e.g., Will SOL hit $200?)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleCreateMarket}
              disabled={loading || !wallet.publicKey}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              {loading ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </div>

        {/* Place Bet */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <h2 className="text-2xl font-bold mb-4">Place Bet</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Market Creator Address"
              id="marketCreatorBet"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <input
              type="number"
              placeholder="Amount (SOL)"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.1"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPrediction(true)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  prediction ? 'bg-green-600 ring-2 ring-green-400' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setPrediction(false)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  !prediction ? 'bg-red-600 ring-2 ring-red-400' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                NO
              </button>
            </div>
            <button
              onClick={() => handlePlaceBet(document.getElementById('marketCreatorBet').value)}
              disabled={loading || !wallet.publicKey}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              {loading ? 'Placing Bet...' : 'Place Bet'}
            </button>
          </div>
        </div>

        {/* Settle Market */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <h2 className="text-2xl font-bold mb-4">Settle Market</h2>
          <p className="text-sm text-gray-300 mb-4">
            Only the creator can settle their market after the deadline
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSettleMarket(true)}
              disabled={loading || !wallet.publicKey}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              YES Wins
            </button>
            <button
              onClick={() => handleSettleMarket(false)}
              disabled={loading || !wallet.publicKey}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              NO Wins
            </button>
          </div>
        </div>

        {/* Claim Winnings */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <h2 className="text-2xl font-bold mb-4">Claim Winnings</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Market Creator Address"
              id="marketCreatorClaim"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => handleClaimWinnings(document.getElementById('marketCreatorClaim').value)}
              disabled={loading || !wallet.publicKey}
              className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              {loading ? 'Claiming...' : 'Claim Winnings'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
