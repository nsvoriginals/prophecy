'use client';
import ThemeToggle from '@/components/theme-toggle';

import { useState, useRef, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import  {Card , CardContent, CardTitle } from '@/components/ui/card';
// Import components
import WalletStatus from '@/components/WalletStatus';
import MessageDisplay from '@/components/MessageDisplay';
import CreateMarket from '@/components/CreateMarket';
import MarketCard from '@/components/MarketCard';
import PlaceBet from '@/components/PlaceBet';
import SettlementModal from '@/components/SettlementModal';
import ClaimWinnings from '@/components/ClaimWinnings';
import UserDashboard from '@/components/UserDashboard';
import { Button } from '@/components/ui/button';
// Import utilities
import { useMarkets } from '@/hooks/useMarkets';
import { useLogger } from '@/hooks/useLogger';
import { checkInitialization, handleInitialize } from '@/utils/initialization';

const PROGRAM_ID = new PublicKey('H6mwQUik2uuctEaBdfCtVfukqXYtQrX4MhWnsbkAQ1L9');

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // State
  const [initialized, setInitialized] = useState(false);
  const [totalMarkets, setTotalMarkets] = useState(0n);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Custom hooks
  const { log, logCount, downloadLogs, clearLogs } = useLogger();
  const { markets, loadingMarkets, fetchMarkets } = useMarkets(connection, log);

  const displayMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    log('INFO', 'UI', `Message: ${text}`, { type });
  };

  // Check initialization on wallet connect
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      checkInitialization(
        connection,
        setInitialized,
        setTotalMarkets,
        log,
        displayMessage
      );
      fetchMarkets();
    }
  }, [wallet.connected, wallet.publicKey]);

  const onInitialize = async () => {
    await handleInitialize(
      wallet,
      connection,
      setLoading,
      setInitialized,
      setTotalMarkets,
      log,
      displayMessage
    );
  };

  const isMarketExpired = (market) => {
    return new Date() > market.deadline;
  };

  // Show UserDashboard if wallet connected
  if (wallet.publicKey && markets.length > 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-6 py-12 max-w-7xl space-y-12">
          {/* Header */}
          <header className="flex items-center justify-between">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary/90 to-primary-foreground/90 bg-clip-text text-transparent">
              Prophecy Protocol
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !border-border !rounded-xl !font-semibold h-12 px-6 shadow-lg" />
            </div>
          </header>

          {/* User Dashboard */}
          <UserDashboard wallet={wallet} markets={markets} />

          {/* Status Bar */}
          <Card className="border-x-0 border-t-2 border-b-2 border-border/30 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    Markets: <span className="font-black text-2xl">{markets.filter(m => !m.settled).length}</span> Active | 
                    <span className="font-black text-2xl ml-4">{totalMarkets.toString()}</span> Total
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {initialized ? 'Protocol ready' : 'Protocol needs initialization'} • Logs: {logCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={fetchMarkets}
                    disabled={loadingMarkets}
                    variant="outline"
                    size="sm"
                    className="px-4 h-10"
                  >
                    Refresh
                  </Button>
                  <Button
                    onClick={() => checkInitialization(connection, setInitialized, setTotalMarkets, log, displayMessage)}
                    variant="outline"
                    size="sm"
                    className="px-4 h-10"
                  >
                    Status
                  </Button>
                  <Button
                    onClick={downloadLogs}
                    variant="outline"
                    size="sm"
                    className="px-4 h-10"
                  >
                    Export Logs
                  </Button>
                  <Button
                    onClick={clearLogs}
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Status */}
          {wallet.publicKey && <WalletStatus publicKey={wallet.publicKey} />}

          {/* Messages */}
          {message && <MessageDisplay message={message} type={messageType} />}

          {/* Initialize Protocol */}
          {!initialized && wallet.publicKey && (
            <Card className="border-destructive border-2 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-4 mb-8">
                  <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl text-destructive font-bold">!</span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-destructive font-bold mb-2">Initialize Protocol</CardTitle>
                    <p className="text-muted-foreground text-lg">Protocol must be initialized once before creating markets</p>
                  </div>
                </div>
                <Button
                  onClick={onInitialize}
                  disabled={loading}
                  className="w-full h-14 text-xl font-bold shadow-2xl"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-background border-t-primary rounded-full animate-spin mr-3" />
                      Initializing...
                    </>
                  ) : (
                    'Initialize Protocol'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create Market */}
          <CreateMarket
            wallet={wallet}
            connection={connection}
            initialized={initialized}
            log={log}
            displayMessage={displayMessage}
            onMarketCreated={() => {
              fetchMarkets();
              checkInitialization(connection, setInitialized, setTotalMarkets, log, displayMessage);
            }}
          />

          {/* Markets Section */}
          <section>
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black scroll-m-20">Live Markets</h2>
              {markets.length === 0 && !loadingMarkets && initialized && (
                <p className="text-lg font-semibold text-muted-foreground">Create the first market</p>
              )}
            </div>
            
            {loadingMarkets ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary mx-auto rounded-full animate-spin mb-8" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">Scanning Blockchain</h3>
                  <p className="text-muted-foreground text-lg">Loading prediction markets...</p>
                </CardContent>
              </Card>
            ) : markets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {markets.map((market) => (
                  <MarketCard
                    key={market.id.toString()}
                    market={market}
                    wallet={wallet}
                    isExpired={isMarketExpired(market)}
                    onBetClick={() => setSelectedMarket(market)}
                    onSettleClick={() => {
                      setSelectedMarket(market);
                      setShowSettleModal(true);
                    }}
                    onClaimClick={(marketId) => {
                      // Handled by ClaimWinnings component
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="text-center py-20">
                  <h3 className="text-2xl font-bold text-foreground mb-4">No Markets Yet</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Be the first to create a prediction market. Share your vision and let others bet on the outcome.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Modals */}
          {selectedMarket && !showSettleModal && (
            <PlaceBet
              market={selectedMarket}
              wallet={wallet}
              connection={connection}
              log={log}
              displayMessage={displayMessage}
              onClose={() => setSelectedMarket(null)}
              onBetPlaced={fetchMarkets}
              open={true}
            />
          )}

          {selectedMarket && showSettleModal && (
            <SettlementModal
              market={selectedMarket}
              wallet={wallet}
              connection={connection}
              log={log}
              displayMessage={displayMessage}
              onClose={() => {
                setShowSettleModal(false);
                setSelectedMarket(null);
              }}
              onSettled={fetchMarkets}
              open={true}
            />
          )}
        </div>
      </main>
    );
  }

  
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl border-0 shadow-2xl">
        <CardContent className="p-12 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary via-primary/75 to-secondary bg-clip-text text-transparent leading-tight">
              Prophecy Protocol
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Solana Prediction Markets
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <WalletMultiButton className="!w-full sm:!w-auto !h-14 !text-lg !font-bold !bg-gradient-to-r !from-primary !to-secondary !hover:from-primary/90 !hover:to-secondary/90 !border-0 !rounded-2xl shadow-2xl px-8" />
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-xl border">
              <ThemeToggle />
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Theme</span>
            </div>
          </div>

          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Connect your wallet to create and participate in prediction markets powered by Solana.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
