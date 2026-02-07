'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaUsers, FaChartBar, FaChartLine } from 'react-icons/fa';

export default function UserDashboard({ wallet, markets }) {
  if (!wallet.publicKey) return null;

  const userMarkets = markets.filter(market => 
    market.creator === wallet.publicKey.toString()
  );

  return (
    <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <FaUsers className="h-6 w-6" />
          Your Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 bg-background/50 hover:bg-background/75 transition-all">
          <CardContent className="p-6 pt-0">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-xs">
                Markets Created
              </Badge>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {userMarkets.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-background/50 hover:bg-background/75 transition-all">
          <CardContent className="p-6 pt-0">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-xs">
                Active Bets
              </Badge>
            </div>
            <div className="text-3xl font-bold text-muted-foreground">
              -
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-background/50 hover:bg-background/75 transition-all">
          <CardContent className="p-6 pt-0">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-xs">
                Total Volume
              </Badge>
              <FaChartLine className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold text-muted-foreground">
              -
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
