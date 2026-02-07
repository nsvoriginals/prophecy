'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaCheck } from 'react-icons/fa';
import { FaCircleXmark } from "react-icons/fa6";
export default function SettlementModal({ 
  market, 
  wallet, 
  connection, 
  log, 
  displayMessage, 
  onClose, 
  onSettled,
  open 
}) {
  const [loading, setLoading] = useState(false);

  const handleSettle = async (outcome) => {
    if (!wallet.publicKey) {
      displayMessage('Connect wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Settling market...', 'info');

      const marketPda = getMarketPDA(market.id);
      const instruction = settleMarketInstruction(marketPda, wallet.publicKey, outcome);
      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'finalized',
      });

      await confirmTransactionWithRetry(connection, signature, blockhash, lastValidBlockHeight, log);
      
      displayMessage(`Market settled! Winner: ${outcome ? 'YES' : 'NO'}`, 'success');
      log('SUCCESS', 'TX', 'Market settled', { signature, marketId: market.id, outcome });
      
      onClose();
      
      setTimeout(() => onSettled(), 1500);
    } catch (error) {
      log('ERROR', 'TX', 'Settle failed', { error: error.message });
      displayMessage(`${error.message || 'Settlement failed'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-sm p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold leading-tight line-clamp-2">
            {market.description}
          </DialogTitle>
          <DialogDescription className="text-sm font-mono text-muted-foreground">
            Market #{market.id} - Choose winning outcome
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Only market creator can settle after deadline
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
              <CardContent className="p-6 text-center" onClick={() => !loading && handleSettle(true)}>
                <FaCheckCircle className="h-12 w-12 mx-auto text-emerald-500 group-hover:scale-110 transition-transform mb-3" />
                <div className="font-bold text-lg text-foreground">YES Wins</div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
              <CardContent className="p-6 text-center" onClick={() => !loading && handleSettle(false)}>
                <FaCircleXmark className="h-12 w-12 mx-auto text-rose-500 group-hover:scale-110 transition-transform mb-3" />
                <div className="font-bold text-lg text-foreground">NO Wins</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-12"
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
