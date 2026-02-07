'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { 
  Sun, 
  Moon, 
  Wallet, 
  ArrowRight,
  FaCheckCircle ,
  XCircle
} from 'lucide-react';

export default function ClaimWinnings({ 
  marketId, 
  wallet, 
  connection, 
  log, 
  displayMessage, 
  onClaimed 
}) {
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    if (!wallet.publicKey) {
      displayMessage('Connect wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Claiming winnings...', 'info');

      const marketPda = getMarketPDA(marketId);
      const userBetPda = getUserBetPDA(marketPda, wallet.publicKey);

      const instruction = claimWinningsInstruction(marketPda, userBetPda, wallet.publicKey);
      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'finalized',
      });

      await confirmTransactionWithRetry(connection, signature, blockhash, lastValidBlockHeight, log);
      
      displayMessage('Winnings claimed!', 'success');
      log('SUCCESS', 'TX', 'Claimed', { signature, marketId });
      
      if (onClaimed) {
        setTimeout(() => onClaimed(), 1500);
      }
    } catch (error) {
      log('ERROR', 'TX', 'Claim failed', { error: error.message });
      displayMessage(`${error.message || 'Claim failed'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardContent className="pt-6">
      <CardFooter className="flex-col items-start gap-4 p-0">
        <div className="text-xs text-muted-foreground mb-3">
          Market #{marketId}
        </div>
        <Button 
          onClick={handleClaim}
          disabled={loading || !wallet.publicKey}
          className="w-full justify-between"
          size="lg"
        >
          {loading ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Claiming...
              </div>
            </>
          ) : (
            <>
              Claim Winnings
              <Wallet className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </CardContent>
  );
}
