use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("H6mwQUik2uuctEaBdfCtVfukqXYtQrX4MhWnsbkAQ1L9");

#[program]
mod prophecy {
    use super::*;

    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.total_markets = 0;
        state.bump = ctx.bumps.state;
        msg!("Prophecy Protocol initialized");
        Ok(())
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        description: String,
        deadline: i64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let market_id = state.total_markets;
        
        let market = &mut ctx.accounts.market;
        market.creator = ctx.accounts.creator.key();
        market.market_id = market_id;
        market.description = description;
        market.deadline = deadline;
        market.yes_amount = 0;
        market.no_amount = 0;
        market.settled = false;
        market.outcome = None;
        market.bump = ctx.bumps.market;
        
        state.total_markets += 1;
        
        msg!("Market #{} created successfully", market_id);
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, prediction: bool) -> Result<()> {
        {
            let market = &mut ctx.accounts.market;
            require!(!market.settled, ErrorCode::MarketAlreadySettled);

            let clock = Clock::get()?;
            require!(
                clock.unix_timestamp < market.deadline,
                ErrorCode::DeadlinePassed
            );
        }
        require!(amount > 0, ErrorCode::BetTooSmall);

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.market.to_account_info(),
            },
        );

        transfer(cpi_context, amount)?;
        let market = &mut ctx.accounts.market;
        if prediction {
            market.yes_amount = market.yes_amount.checked_add(amount).unwrap();
        } else {
            market.no_amount = market.no_amount.checked_add(amount).unwrap();
        }

        let user_bet = &mut ctx.accounts.user_bet;
        user_bet.user = ctx.accounts.user.key();
        user_bet.market = market.key();
        user_bet.amount = amount;
        user_bet.prediction = prediction;
        user_bet.claimed = false;
        user_bet.bump = ctx.bumps.user_bet;

        msg!(
            "Bet placed: {} SOL on {}",
            amount,
            if prediction { "YES" } else { "NO" }
        );
        Ok(())
    }

    pub fn settle_market(ctx: Context<SettleMarket>, outcome: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(
            ctx.accounts.creator.key() == market.creator,
            ErrorCode::Unauthorized
        );

        let clock = Clock::get()?;
        require!(clock.unix_timestamp >= market.deadline, ErrorCode::TooEarly);
        require!(!market.settled, ErrorCode::AlreadySettled);

        market.outcome = Some(outcome);
        market.settled = true;

        msg!(
            "Market settled: {} wins!",
            if outcome { "YES" } else { "NO" }
        );
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(market.settled, ErrorCode::NotSettled);
        require!(!user_bet.claimed, ErrorCode::AlreadyClaimed);

        let outcome = market.outcome.unwrap();
        require!(user_bet.prediction == outcome, ErrorCode::DidNotWin);

        let total_pot = market.yes_amount.checked_add(market.no_amount).unwrap();
        let winning_pool = if outcome {
            market.yes_amount
        } else {
            market.no_amount
        };

        let payout = (user_bet.amount as u128)
            .checked_mul(total_pot as u128)
            .unwrap()
            .checked_div(winning_pool as u128)
            .unwrap() as u64;

        **ctx
            .accounts
            .market
            .to_account_info()
            .try_borrow_mut_lamports()? -= payout;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += payout;

        user_bet.claimed = true;

        msg!("Winnings claimed: {} lamports", payout);
        Ok(())
    }
}

// ACCOUNT STRUCTS
#[account]
pub struct GlobalState {
    pub total_markets: u64,  
    pub bump: u8,
}

#[account]
pub struct Market {
    pub creator: Pubkey,
    pub market_id: u64,      
    pub description: String,
    pub yes_amount: u64,
    pub no_amount: u64,
    pub deadline: i64,
    pub settled: bool,
    pub outcome: Option<bool>,
    pub bump: u8,
}

#[account]
pub struct UserBet {
    pub user: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub claimed: bool,
    pub bump: u8,
}

// CONTEXT STRUCTS
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 1,  
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, GlobalState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(description: String, deadline: i64)]
pub struct CreateMarket<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, GlobalState>,

    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 300,  
        seeds = [b"market", state.total_markets.to_le_bytes().as_ref()],  
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = user,
        space = 8 + 100,
        seeds = [b"user_bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"user_bet", market.key().as_ref(), user.key().as_ref()],
        bump = user_bet.bump,
        has_one = user,
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(mut)]
    pub user: Signer<'info>,
}

// ERROR CODES
#[error_code]
pub enum ErrorCode {
    #[msg("Market has already been settled")]
    MarketAlreadySettled,

    #[msg("Deadline has passed, no more bets allowed")]
    DeadlinePassed,

    #[msg("Bet amount must be greater than 0")]
    BetTooSmall,

    #[msg("Only market creator can settle")]
    Unauthorized,

    #[msg("Cannot settle before deadline")]
    TooEarly,

    #[msg("Market already settled")]
    AlreadySettled,

    #[msg("Market not settled yet")]
    NotSettled,

    #[msg("Winnings already claimed")]
    AlreadyClaimed,

    #[msg("You did not win this bet")]
    DidNotWin,
}