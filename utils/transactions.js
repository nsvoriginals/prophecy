// Transaction confirmation with retry logic
export const confirmTransactionWithRetry = async (
  connection,
  signature,
  blockhash,
  lastValidBlockHeight,
  log,
  maxRetries = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );
      
      log('SUCCESS', 'NETWORK', 'Transaction confirmed', { signature });
      return confirmation;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      log('WARN', 'NETWORK', `Retry ${i + 1}/${maxRetries}`, { signature });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
