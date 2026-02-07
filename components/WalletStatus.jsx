'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaWallet} from 'react-icons/fa'
export function WalletStatus({ publicKey }) {
  return (
    <Card className="mb-6 border-2 shadow-sm">
      <CardContent className="p-6 pt-0">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="flex items-center gap-1">
            <FaWallet  className="h-4 w-4" />
            Connected
          </Badge>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded-md truncate max-w-xs">
            {publicKey?.toString()}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletStatus;
