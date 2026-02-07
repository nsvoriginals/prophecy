import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';
import { sha256 } from 'js-sha256';
import { u64ToLeBytes } from './buffer';

const PROGRAM_ID = new PublicKey('H6mwQUik2uuctEaBdfCtVfukqXYtQrX4MhWnsbkAQ1L9');

// Initialize Protocol
export const initializeInstruction = (statePda, authority) => {
  const discriminator = Buffer.from(sha256.digest('global:initialize')).subarray(0, 8);
  
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: statePda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator,
  });
};

// Create Market
export const createMarketInstruction = (statePda, marketPda, creator, description, deadlineUnix, log) => {
  const discriminator = Buffer.from(sha256.digest('global:create_market')).subarray(0, 8);
  
  const descBytes = Buffer.from(description, 'utf8');
  const descLength = Buffer.alloc(4);
  descLength.writeUInt32LE(descBytes.length, 0);

  const deadlineBuffer = u64ToLeBytes(deadlineUnix);

  const data = Buffer.concat([discriminator, descLength, descBytes, deadlineBuffer]);

  log('DEBUG', 'INSTRUCTION', 'create_market data', {
    descLength: descBytes.length,
    deadline: deadlineUnix,
    dataHex: data.toString('hex')
  });

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: statePda, isSigner: false, isWritable: true },
      { pubkey: marketPda, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
};

// Place Bet
export const placeBetInstruction = (marketPda, userBetPda, user, amountLamports, prediction, log) => {
  const discriminator = Buffer.from(sha256.digest('global:place_bet')).subarray(0, 8);
  const amountBuffer = u64ToLeBytes(amountLamports);
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

// Settle Market
export const settleMarketInstruction = (marketPda, creator, outcome) => {
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

// Claim Winnings
export const claimWinningsInstruction = (marketPda, userBetPda, user) => {
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
