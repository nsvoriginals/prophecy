'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FaCheckCircle, FaCircleXmark } from 'react-icons/fa6';

export function SettleMarket({ onMessage }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const handleSettleMarket = async (outcome) => {
    if (!wallet.publicKey) {
      onMessage('Please connect your wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      onMessage('Settling market...', 'info');

      const marketPda = getMarketPDA(wallet.publicKey);
      const instruction = settleMarketInstruction(marketPda, wallet.publicKey, outcome);

      const transaction = new Transaction().add(instruction);
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      onMessage(
        `Market settled. Winner: ${outcome ? 'YES' : 'NO'}. Transaction: ${signature.substring(0, 8)}...`,
        'success'
      );
    } catch (error) {
      console.error('Error:', error);
      onMessage(error.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FaCheckCircle className="h-5 w-5" />
          Settle Market
        </CardTitle>
        <CardDescription>
          Only the creator can settle their market after the deadline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleSettleMarket(true)}
            disabled={loading || !wallet.publicKey}
            size="lg"
            className="h-14 group"
          >
            <FaCheckCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            YES Wins
          </Button>
          <Button
            onClick={() => handleSettleMarket(false)}
            disabled={loading || !wallet.publicKey}
            variant="destructive"
            size="lg"
            className="h-14 group"
          >
            <FaCircleXmark className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            NO Wins
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
