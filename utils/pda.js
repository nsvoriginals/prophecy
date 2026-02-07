import { PublicKey } from '@solana/web3.js';
import { u64ToLeBytes } from './buffer';

const PROGRAM_ID = new PublicKey('H6mwQUik2uuctEaBdfCtVfukqXYtQrX4MhWnsbkAQ1L9');

// Get State PDA
export const getStatePDA = () => {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    PROGRAM_ID
  );
  return pda;
};

// Get Market PDA by ID
export const getMarketPDA = (marketId) => {
  const idBuffer = u64ToLeBytes(marketId);
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('market'), idBuffer],
    PROGRAM_ID
  );
  return pda;
};

// Get UserBet PDA
export const getUserBetPDA = (marketPda, userPubkey) => {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_bet'), marketPda.toBuffer(), userPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};
