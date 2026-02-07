'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FaWallet, FaPlus, FaClock } from 'react-icons/fa';

export default function CreateMarket({ 
  wallet, 
  connection, 
  initialized, 
  log, 
  displayMessage, 
  onMarketCreated 
}) {
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateMarket = async () => {
    if (!wallet.publicKey) {
      displayMessage('Connect wallet', 'error');
      return;
    }

    if (!description || !deadline) {
      displayMessage('Fill all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      displayMessage('Creating market...', 'info');

      const statePda = getStatePDA();
      const stateAccount = await connection.getAccountInfo(statePda);
      
      if (!stateAccount) {
        displayMessage('Protocol not initialized! Initialize first.', 'error');
        setLoading(false);
        return;
      }

      const currentTotalMarkets = readU64LE(stateAccount.data, 8);
      const marketPda = getMarketPDA(currentTotalMarkets);
      
      const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);
      
      log('INFO', 'CREATE', 'Creating market', {
        marketId: currentTotalMarkets.toString(),
        description,
        deadline: deadlineUnix,
        marketPda: marketPda.toString()
      });

      const instruction = createMarketInstruction(
        statePda,
        marketPda,
        wallet.publicKey,
        description,
        deadlineUnix,
        log
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: wallet.publicKey })
        .add(instruction);
      
      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await confirmTransactionWithRetry(connection, signature, blockhash, lastValidBlockHeight, log);
      
      displayMessage(`Market #${currentTotalMarkets} created!`, 'success');
      log('SUCCESS', 'TX', 'Market created', { signature, marketId: currentTotalMarkets.toString() });
      
      setDescription('');
      setDeadline('');
      
      setTimeout(() => {
        onMarketCreated();
      }, 1500);
    } catch (error) {
      log('ERROR', 'TX', 'Create failed', { error: error.message, logs: error.logs });
      displayMessage(`${error.message || 'Failed to create market'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-0 shadow-2xl bg-gradient-to-br from-background to-muted">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <FaPlus className="h-7 w-7" />
          Create Market
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Create a new prediction market question
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            Question
          </Label>
          <Input
            id="description"
            type="text"
            placeholder="Will Bitcoin reach $100k by end of 2024?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={256}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/256 characters
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-sm font-semibold flex items-center gap-1">
            <FaClock className="h-4 w-4" />
            Deadline
          </Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-12"
          />
        </div>
      </CardContent>
      
      <CardContent className="pt-0">
        <Button
          onClick={handleCreateMarket}
          disabled={loading || !wallet.publicKey || !initialized || !description || !deadline}
          className="w-full h-14 text-lg font-bold shadow-lg"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-background border-t-primary rounded-full animate-spin" />
              Creating...
            </div>
          ) : (
            <span className="flex items-center gap-2">
              Create Market
              <FaPlus className="h-4 w-4" />
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
