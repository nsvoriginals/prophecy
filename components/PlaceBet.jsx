'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { 
  FaWallet,
  FaChartLine, 
  FaChartBar 
} from 'react-icons/fa';

export default function PlaceBet({ 
  market, 
  wallet, 
  connection, 
  log, 
  displayMessage, 
  onClose, 
  onBetPlaced,
  open 
}) {
  const [betAmount, setBetAmount] = useState('');
  const [prediction, setPrediction] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async () => {
    if (!wallet.publicKey) {
      displayMessage('Connect wallet', 'error');
      return;
    }

    if (!betAmount || betAmount <= 0) {
      displayMessage('Enter valid amount', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Placing bet...', 'info');

      const marketPda = getMarketPDA(market.id);
      const userBetPda = getUserBetPDA(marketPda, wallet.publicKey);
      const amountLamports = Math.floor(parseFloat(betAmount) * LAMPORTS_PER_SOL);

      const instruction = placeBetInstruction(
        marketPda,
        userBetPda,
        wallet.publicKey,
        amountLamports,
        prediction,
        log
      );

      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'finalized',
      });

      await confirmTransactionWithRetry(connection, signature, blockhash, lastValidBlockHeight, log);
      
      displayMessage(`Bet placed on ${prediction ? 'YES' : 'NO'}!`, 'success');
      log('SUCCESS', 'TX', 'Bet placed', { signature, marketId: market.id, betAmount, prediction });
      
      onClose();
      setBetAmount('');
      
      setTimeout(() => onBetPlaced(), 1500);
    } catch (error) {
      log('ERROR', 'TX', 'Bet failed', { error: error.message });
      displayMessage(`${error.message || 'Bet failed'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const yesSol = Number(market.totalYes) / LAMPORTS_PER_SOL;
  const noSol = Number(market.totalNo) / LAMPORTS_PER_SOL;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-md p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold leading-tight line-clamp-2">
            {market.description}
          </DialogTitle>
          <DialogDescription className="text-sm font-mono text-muted-foreground">
            Market #{market.id}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-2 p-4 border-b border-border">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-emerald-600">
                  {yesSol.toFixed(2)}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700">
                  <FaChartLine className="h-3 w-3" />
                  YES {market.yesPercent}%
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-rose-600">
                  {noSol.toFixed(2)}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-rose-700">
                  <FaChartBar className="h-3 w-3" />
                  NO {market.noPercent}%
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Bet Amount (SOL)</Label>
            <Input
              type="number"
              placeholder="0.1"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.01"
              min="0"
              className="h-12 text-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={prediction ? "default" : "outline"}
              size="lg"
              onClick={() => setPrediction(true)}
              className="h-14 text-lg font-bold group"
            >
              <FaChartLine className="h-5 w-5 mr-2 group-hover:rotate-6 transition-transform" />
              YES
            </Button>
            <Button
              variant={!prediction ? "default" : "outline"}
              size="lg"
              onClick={() => setPrediction(false)}
              className="h-14 text-lg font-bold group"
            >
              <FaChartBar className="h-5 w-5 mr-2 group-hover:rotate-6 transition-transform" />
              NO
            </Button>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 px-8 flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlaceBet}
            disabled={loading || !betAmount || parseFloat(betAmount) <= 0 || !wallet.publicKey}
            className="h-12 px-8 flex-1 text-lg font-bold shadow-lg flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-background border-t-primary rounded-full animate-spin" />
                Placing...
              </>
            ) : (
              <>
                Bet {betAmount || '0'} SOL
                <FaWallet className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
