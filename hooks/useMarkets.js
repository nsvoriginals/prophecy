import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getStatePDA, getMarketPDA } from '@/utils/pda';
import { readU64LE, readI64LE } from '@/utils/buffer';

export const useMarkets = (connection, log) => {
  const [markets, setMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);

  const parseMarketData = useCallback((accountData, marketId) => {
    if (!accountData || accountData.length < 100) {
      log('WARN', 'PARSE', 'Insufficient data', { length: accountData?.length });
      return null;
    }

    try {
      let offset = 8; // Skip discriminator

      // Read fields in order matching Rust struct
      const creator = new PublicKey(accountData.slice(offset, offset + 32));
      offset += 32;

      const marketIdRead = readU64LE(accountData, offset);
      offset += 8;

      // String: 4-byte length prefix + data
      const descLen = accountData.readUInt32LE(offset);
      offset += 4;
      
      if (offset + descLen > accountData.length) {
        log('ERROR', 'PARSE', 'Description overflow', { descLen, dataLength: accountData.length });
        return null;
      }
      
      const description = accountData.slice(offset, offset + descLen).toString('utf8');
      offset += descLen;

      const yesAmount = readU64LE(accountData, offset);
      offset += 8;

      const noAmount = readU64LE(accountData, offset);
      offset += 8;

      const deadlineTimestamp = readI64LE(accountData, offset);
      offset += 8;

      const settled = accountData[offset] === 1;
      offset += 1;

      // Option<bool>: 1 byte discriminant (0=None, 1=Some), then 1 byte value if Some
      const hasOutcome = accountData[offset] === 1;
      offset += 1;
      let outcome = 'Pending';
      if (hasOutcome && offset < accountData.length) {
        outcome = accountData[offset] === 1 ? 'YES' : 'NO';
      }

      const totalPool = yesAmount + noAmount;
      const yesPercent = totalPool > 0n ? Number((yesAmount * 100n) / totalPool) : 50;
      const noPercent = 100 - yesPercent;

      const deadlineDate = new Date(Number(deadlineTimestamp) * 1000);

      return {
        id: marketId,
        creator: creator.toString(),
        description,
        yesAmount: yesAmount.toString(),
        noAmount: noAmount.toString(),
        totalPool: totalPool.toString(),
        yesPercent,
        noPercent,
        deadline: deadlineDate,
        deadlineStr: deadlineDate.toLocaleString(),
        settled,
        outcome,
        pda: getMarketPDA(marketId),
      };
    } catch (error) {
      log('ERROR', 'PARSE', 'Failed to parse market', { 
        error: error.message, 
        marketId,
        stack: error.stack 
      });
      return null;
    }
  }, [log]);

  const fetchMarkets = useCallback(async () => {
    if (!connection) return;

    setLoadingMarkets(true);
    log('INFO', 'FETCH', 'Fetching markets...');

    try {
      // First, get total markets from state
      const statePda = getStatePDA();
      const stateAccount = await connection.getAccountInfo(statePda);
      
      if (!stateAccount) {
        log('WARN', 'FETCH', 'State account not found - protocol not initialized');
        setMarkets([]);
        setLoadingMarkets(false);
        return;
      }

      const totalMarketsCount = readU64LE(stateAccount.data, 8);
      log('INFO', 'FETCH', `Total markets: ${totalMarketsCount}`);

      const marketsList = [];

      // Fetch each market
      for (let id = 0n; id < totalMarketsCount; id++) {
        try {
          const marketPda = getMarketPDA(id);
          const accountInfo = await connection.getAccountInfo(marketPda);
          
          if (accountInfo && accountInfo.data.length > 0) {
            const market = parseMarketData(accountInfo.data, id);
            if (market) {
              marketsList.push(market);
            }
          } else {
            log('WARN', 'FETCH', `Market #${id} account not found`);
          }
        } catch (error) {
          log('ERROR', 'FETCH', `Failed to fetch market #${id}`, { error: error.message });
        }
      }

      setMarkets(marketsList);
      log('SUCCESS', 'FETCH', `Loaded ${marketsList.length} markets`);
    } catch (error) {
      log('ERROR', 'FETCH', 'Failed to fetch markets', { error: error.message });
    } finally {
      setLoadingMarkets(false);
    }
  }, [connection, parseMarketData, log]);

  return { markets, loadingMarkets, fetchMarkets };
};
