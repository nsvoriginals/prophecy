'use client';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FaWallet, 
  FaCrown, 
  FaClock, 
  FaChartLine,
  FaChartBar 
} from 'react-icons/fa';

export default function MarketCard({ 
  market, 
  wallet,        // ✅ Fixed: was FaWallet
  isExpired, 
  onBetClick, 
  onSettleClick, 
  onClaimClick 
}) {
  const isCreator = wallet.publicKey && market.creator === wallet.publicKey.toString();  // ✅ Fixed

  const solPool = Number(market.totalPool) / LAMPORTS_PER_SOL;
  const yesSol = Number(market.totalYes) / LAMPORTS_PER_SOL;
  const noSol = Number(market.totalNo) / LAMPORTS_PER_SOL;

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all border-border hover:border-primary/50"
      onClick={() => !market.settled && onBetClick(market)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={market.settled ? "default" : isExpired ? "secondary" : "destructive"} className="text-xs font-bold">
            {market.settled ? 'SETTLED' : isExpired ? 'EXPIRED' : 'LIVE'}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            #{market.id}
          </Badge>
          {isCreator && (
            <Badge variant="secondary" className="text-xs">
              <FaCrown className="h-3 w-3 mr-1" />
              YOU
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <CardTitle className="line-clamp-2 leading-tight text-foreground group-hover:text-primary h-12">
          {market.description}
        </CardTitle>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Pool</p>
            <p className="text-2xl font-bold text-foreground">
              {solPool.toFixed(4)} <span className="text-sm font-normal">SOL</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <FaChartLine className="h-3 w-3 text-emerald-500" />
                YES
              </span>
              <span>{market.yesPercent?.toFixed(1)}%</span>
              <span className="flex items-center gap-1">
                <FaChartBar className="h-3 w-3 text-rose-500" />
                NO
              </span>
              <span>{market.noPercent?.toFixed(1)}%</span>
            </div>
            <Progress value={market.yesPercent || 50} className="h-2 [&>div]:!bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">YES</p>
              <p className="text-sm font-bold text-emerald-600">{yesSol.toFixed(2)} SOL</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">NO</p>
              <p className="text-sm font-bold text-rose-600">{noSol.toFixed(2)} SOL</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
            <span className="flex items-center gap-1 text-muted-foreground font-medium">
              <FaClock className="h-3 w-3" />
              {market.deadlineStr}
            </span>
          </div>
        </div>

        {market.settled && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <p className="text-center font-bold text-emerald-600 text-sm">
              WINNER: {market.outcome}
            </p>
          </div>
        )}
      </CardContent>

      <CardContent className="p-0 pt-4 border-t border-border">
        <div className="flex gap-2 p-1">
          {!market.settled && !isExpired && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onBetClick(market);
              }}
              className="flex-1"
              size="sm"
            >
              <FaWallet className="h-4 w-4 mr-2" />
              Place Bet
            </Button>
          )}
          {!market.settled && isExpired && isCreator && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onSettleClick(market);
              }}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Settle
            </Button>
          )}
          {market.settled && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClaimClick(market.id);
              }}
              className="flex-1"
              size="sm"
            >
              <FaWallet className="h-4 w-4 mr-2" />
              Claim
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
