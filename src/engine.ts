import { Connection, PublicKey, ComputeBudgetProgram, Keypair, TransactionSignature, Finality } from '@solana/web3.js';
import {
    BN, Program, AnchorProvider, Wallet, AccountClient, ProgramAccount
} from '@project-serum/anchor';
import { AccountLayout, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import * as SPLToken from "@solana/spl-token";
import {
    readAllFromRPC, readFromRPCOrError, readFromRPC, byteArrayToString, stringToByteArray, keypairToAsyncSigner, AsyncSigner, buildDynamicTransactions, sendTransaction,
    InstructionReturn, createAssociatedTokenAccount
} from '@staratlas/data-source';
import {
    Fleet, SurveyDataUnitTracker, SageIDLProgram, SageProgram, getOrCreateAssociatedTokenAccount, ShipStats, MineItem, Resource, Planet, PlanetType,
    Starbase, StarbaseAccount, getStarbasePlayersByProfile, StarbasePlayer, cleanUpStarbaseCargoPods, getCargoPodsByAuthority, Sector,
    betterGetTokenAccountsByOwner, Game, getCargoSpaceUsedByTokenAmount, getUsedCargoSpace, getTokenAmountToTeachTargetStat, calculateDistance,
    CraftingInstance
} from '@staratlas/sage';
import { CargoProgram, CargoIDLProgram, CargoType, CargoStatsDefinition, CargoPod } from '@staratlas/cargo';
import { CraftingProgram, CraftingIDLProgram, CraftingFacility, Recipe, RecipeStatus, CraftingProcess, CraftableItem } from '@staratlas/crafting';
import { PlayerProfile, PlayerProfileProgram, PlayerProfileIDLProgram, PlayerName } from '@staratlas/player-profile';
import { ProfileFactionAccount, ProfileFactionProgram, ProfileFactionIDLProgram } from '@staratlas/profile-faction';
import { encrypt, decrypt } from './crypto';
import readline from 'readline';
import * as base58 from 'bs58';
import fs from 'fs';


let wallet: Keypair;
let config: any;
let ordersJson: any;


let connectionMain: Connection;
let connectionSecondary: Connection;
let gameID = new PublicKey('GameYNgVLn9kd8BQcbHm8jNMqJHWhcZ1YTNy6Pn3FXo5');
let ATLAS = new PublicKey('ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx');
let SDUfrom = new PublicKey("8xV2p8XR7V6zyGeiJNJmuMsRHYWALMrp5fJnPioB55X7");

let SDU = new PublicKey("SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM");
let TOOL = new PublicKey("tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL");
let FOOD = new PublicKey("foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG");
let AMMO = new PublicKey("ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK");
let FUEL = new PublicKey("fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim");
let HYDROGEN = new PublicKey("HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp");
let BIOMASS = new PublicKey("MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog");
let CARBON = new PublicKey("CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X");
let IRONORE = new PublicKey("FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J");
let COPPERORE = new PublicKey("CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc");
let LUMANITE = new PublicKey("LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj");
let ROCHINOL = new PublicKey("RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5");
let ARCO = new PublicKey("ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg");
let DIAMOND = new PublicKey("DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944");
let GOLDENTICKET = new PublicKey("GLDTKDYdSkdCzSC6fqRWqHZ5fUQGsm1CM4nMZnsCZNcX");
let ENERGYSUBSTRATE = new PublicKey("SUBSVX9LYiPrzHeg2bZrqFSDSKkrQkiCesr6SjtdHaX");
let ELECTROMAGNET = new PublicKey("EMAGoQSP89CJV5focVjrpEuE4CeqJ4k1DouQW7gUu7yX");
let FRAMEWORK = new PublicKey("FMWKb7YJA5upZHbu5FjVRRoxdDw2FYFAu284VqUGF9C2");
let POWERSOURCE = new PublicKey("PoWRYJnw3YDSyXgNtN3mQ3TKUMoUSsLAbvE8Ejade3u");
let PARTICLEACCELERETOR = new PublicKey("PTCLSWbwZ3mqZqHAporphY2ofio8acsastaHfoP87Dc");
let RADIATONABSORBER = new PublicKey("RABSXX6RcqJ1L5qsGY64j91pmbQVbsYRQuw1mmxhxFe");
let SUPERCONDUCTOR = new PublicKey("CoNDDRCNxXAMGscCdejioDzb6XKxSzonbWb36wzSgp5T");
let STRANGEEMITTER = new PublicKey("EMiTWSLgjDVkBbLFaMcGU6QqFWzX9JX6kqs1UtUjsmJA");
let CRYSTALLATTICE = new PublicKey("CRYSNnUd7cZvVfrEVtVNKmXiCPYdZ1S5pM5qG2FDVZHF");
let COPPERWIRE = new PublicKey("cwirGHLB2heKjCeTy4Mbp4M443fU4V7vy2JouvYbZna");
let COPPER = new PublicKey("CPPRam7wKuBkYzN5zCffgNU17RKaeMEns4ZD83BqBVNR");
let ELECTRONICS = new PublicKey("ELECrjC8m9GxCqcm4XCNpFvkS8fHStAvymS6MJbe3XLZ");
let GRAPHENE = new PublicKey("GRAPHKGoKtXtdPBx17h6fWopdT5tLjfAP8cDJ1SvvDn4");
let HYDROCARBON = new PublicKey("HYCBuSWCJ5ZEyANexU94y1BaBPtAX2kzBgGD2vES2t6M");
let IRON = new PublicKey("ironxrUhTEaBiR9Pgp6hy4qWx6V2FirDoXhsFP25GFP");
let MAGNET = new PublicKey("MAGNMDeDJLvGAnriBvzWruZHfXNwWHhxnoNF75AQYM5");
let POLYMER = new PublicKey("PoLYs2hbRt5iDibrkPT9e6xWuhSS45yZji5ChgJBvcB");
let STEEL = new PublicKey("STEELXLJ8nfJy3P4aNuGxyNRbWPohqHSwxY75NsJRGG");

let numConsoleMessage = 0;

let refreshOrders = false;

let writeLogFile = false;
let logPathWindows = `${__dirname}\\log\\${new Date().toISOString().replaceAll(":", "_")}.log`;
let logPathOtherOS = `${__dirname}/log/${new Date().toISOString().replaceAll(":", "_")}.log`;
let logPath = process.platform == "win32" ? logPathWindows : logPathOtherOS;

let orders: any;
let sduMap: MapSector[] = [];
let sduMapLastActualisation = Date.now() / 1000 | 0;

let lastOrdersJson = "";
let suspendLog = false;

let appStart = new Date().getTime();
let lastTxSend = new Date().getTime();

var focusedOrderIdx = -1;
var focusedOrderOnHold = false;

export type RouteStep = {
    from: [BN, BN];
    to: [BN, BN];
    warp: boolean;
};

const probMax = 0.65;
export type MapSector = {
    maxDirection: number;
    maxProb: number;
    probability: number;
    lastTimeMeasured: number;
};

function myLog(
    data: String,
    important: boolean = false
) {
    numConsoleMessage++;

    let message = `${new Date().toLocaleString()}, ${(important ? '>>>>>>' : '')} ${data} ${(important ? '<<<<<<' : '')}`;

    if (!suspendLog) {
        console.log(message);
    }

    if (writeLogFile) {
        try {
            var fs = require('fs');
            fs.writeFile(logPath, message + "\n", { flag: "a+" }, function (err: any) {
            });
        } catch (e) {
        }
    }
}
function initFile() {
    if (!fs.existsSync("./src/orders.json")) {
        myLog("Create orders.json file");
        fs.writeFileSync("./src/orders.json", "[]");
    }

    if (!fs.existsSync("./src/config.json")) {
        myLog("Create config.json file");
        fs.writeFileSync("./src/config.json",
            `
      {
        "rpc" : [""],
        "privateKey": {
            "iv": "",
            "content": ""
        }
      }
    `);

        myLog("Please edit the config.json file!");
        process.exit();
    }

    fs.watch("./src/orders.json", (eventType, filename) => {
        if (eventType === 'change') {
            try {
                var rawData = fs.readFileSync("./src/orders.json").toString();

                if (rawData !== "" && lastOrdersJson !== "" && rawData !== lastOrdersJson) {
                    refreshOrders = true;
                }
            } catch (e) {
                myLog(e.message);
            }
        }
    });

    config = JSON.parse(fs.readFileSync("./src/config.json").toString());
    connectionMain = new Connection(config.rpc[0], "confirmed");
    connectionSecondary = config.rpc.length > 1 ? new Connection(config.rpc[1], "confirmed") : new Connection(config.rpc[0], "confirmed");

    var rawData = fs.readFileSync("./src/orders.json").toString();
    ordersJson = JSON.parse(rawData);
    lastOrdersJson = rawData;
}

const initWallet = async () => {
    var param = process.argv.slice(2);

    initFile();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (param.length == 0) {
        myLog("---INITIAL CONFIGURATION---");
        rl.question('What is your private key?\n', function (privateKey) {
            rl.question('Enter a password (32 characters long) to encrypt your private key (If you lose this password, you can always repeat the initial procedure and choose a new one.):\n ', function (secretKey) {
                var hash = encrypt(privateKey, secretKey);

                config.privateKey.iv = hash.iv;
                config.privateKey.content = hash.content;

                var fs = require('fs');
                fs.writeFile('./src/config.json', JSON.stringify(config), function (err: any) {
                    if (err) {
                        myLog(err);
                    }
                });
                rl.close();

            });
        });

    } else {
        writeLogFile = param.length < 2 || param[1] == "1";

        wallet = Keypair.fromSecretKey(base58.decode(decrypt(config.privateKey, param[0])));

        myLog(`System start - ${process.platform} writeLogFile: ${writeLogFile}`);

        await prepareOrders();

        start();
    }
}

function start() {

    const provider = new AnchorProvider(connectionMain, new Wallet(wallet), {});
    const sageProgram = SageProgram.buildProgram(new PublicKey('SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6'), provider);
    const craftingProgram = CraftingProgram.buildProgram(new PublicKey('Craftf1EGzEoPFJ1rpaTSQG1F6hhRRBAf4gRo9hdSZjR'), provider);
    const cargoProgram = CargoProgram.buildProgram(new PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'), provider);
    const profileProgram = PlayerProfileProgram.buildProgram(new PublicKey('pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9'), provider);
    const profileFactionProgram = ProfileFactionProgram.buildProgram(new PublicKey('pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq'), provider);
    const walletSigner = keypairToAsyncSigner(wallet);

    processOrders(connectionMain, connectionSecondary, walletSigner, sageProgram, craftingProgram, cargoProgram, profileProgram, profileFactionProgram);
}

export async function processOrders(
    connection: Connection,
    connectionSecondary: Connection,
    walletSigner: AsyncSigner,
    sageProgram: SageIDLProgram,
    craftingProgram: CraftingIDLProgram,
    cargoProgram: CargoIDLProgram,
    playerProfileProgram: PlayerProfileIDLProgram,
    profileFactionProgram: ProfileFactionIDLProgram
): Promise<void> {

    awaitRateLimit();
    const game = await readFromRPCOrError(
        connection,
        sageProgram,
        gameID,
        Game,
        'confirmed',
    );

    awaitRateLimit();
    const profiles: PlayerProfile[] = (await readAllFromRPC(
        connection,
        playerProfileProgram,
        PlayerProfile,
        'confirmed',
        [
            {
                memcmp: {
                    offset: PlayerProfile.MIN_DATA_SIZE + 2,
                    bytes: wallet.publicKey.toBase58(),
                },
            },
        ],
    )).map((p) => p.type === 'ok' && p.data);
    if (profiles.length === 0) throw 'no player profile found';

    const primaryProfile = profiles.shift();

    const [nameKey] = PlayerName.findAddress(playerProfileProgram, primaryProfile.key);

    awaitRateLimit();
    const nameAccount = await readFromRPCOrError(
        connection,
        playerProfileProgram,
        nameKey,
        PlayerName,
    );

    const [factionKey] = ProfileFactionAccount.findAddress(
        profileFactionProgram,
        primaryProfile.key,
    );

    awaitRateLimit();
    const factionAccount = await readFromRPCOrError(
        connection,
        profileFactionProgram,
        factionKey,
        ProfileFactionAccount,
    );

    awaitRateLimit();
    const planets: Planet[] = (await readAllFromRPC(
        connection,
        sageProgram,
        Planet,
        'confirmed',
        [
            {
                memcmp: {
                    offset: 8 + 1 + 64,
                    bytes: gameID.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: 8 + 1 + 64 + 32 + 8 * 2 + 8 * 2,
                    bytes: (PlanetType.AsteroidBelt + 1).toString(),
                },
            },
        ],
    )).map((p) => p.type === 'ok' && p.data);

    if (planets.length === 0) throw 'no planets found';
    myLog(`Retrieved planets ${planets.length}`);

    const recipes = (await readAllFromRPC(connection, craftingProgram, Recipe, 'confirmed', [
        {
            memcmp: {
                offset: 8 + 1 + 32 + 32 + 8 + 8 + 32 + 1 + 1 + 1 + 2,
                bytes: base58.encode(Buffer.from([RecipeStatus.Active as number])),
            },
        },
    ],)).map(
        (recipe) => recipe.type === 'ok' && recipe.data
    );
    if (recipes.length === 0) throw 'no recipes found';
    myLog(`Retrieved recipes ${recipes.length}`);

    myLog(`Retrieved profile for ${nameAccount.name} on faction ${factionAccount.data.faction}`);

    awaitRateLimit();
    const sduTracker = (await readAllFromRPC(connection, sageProgram, SurveyDataUnitTracker)).map(
        (sduTracker) => sduTracker.type === 'ok' && sduTracker.data
    );
    if (sduTracker.length === 0) throw 'no sduTracker found';

    myLog(`Retrieved sduTracker ${sduTracker[0].key} `);

    var trackerBefore = await readFromRPCOrError(
        connection,
        sageProgram,
        sduTracker[0].key,
        SurveyDataUnitTracker,
        'confirmed',
    );

    awaitRateLimit();
    const cargoStatsDefinition = (await readAllFromRPC(connection, cargoProgram, CargoStatsDefinition)).map(
        (cargoStatsDefinition) => cargoStatsDefinition.type === 'ok' && cargoStatsDefinition.data
    );
    if (cargoStatsDefinition.length === 0) throw 'no cargoStatsDefinition found';

    myLog(`Retrieved cargoStatsDefinition ${cargoStatsDefinition[cargoStatsDefinition.length - 1].key} `);

    await initSDUmap(trackerBefore);

    var orderSeq: number[] = [];
    for (var focIdx = 0; focIdx < orders.length; focIdx++) {
        if (focIdx != focusedOrderIdx)
            orderSeq.push(focIdx);
    }

    while (true) {
        let cycleStartTime = Date.now() / 1000 | 0;

        if (refreshOrders)
            activateNewOrders();

        try {
            awaitRateLimit();
            const fleets = (await readAllFromRPC(connection, sageProgram, Fleet, 'processed', [
                {
                    memcmp: {
                        offset: 8 + 1,
                        bytes: gameID.toBase58(),
                    },
                },
                {

                    memcmp: {
                        offset: 8 + 1 + 32,
                        bytes: primaryProfile.key.toBase58(),
                    },
                },

            ],)).map(
                (fleet) => fleet.type === 'ok' && fleet.data
            );
            myLog(``);
            myLog(`fleets count ${fleets.length}`);

            awaitRateLimit();
            var starbasePlayers = (await getStarbasePlayersByProfile(
                connection,
                sageProgram,
                primaryProfile.key,
                gameID,
            )).map(
                (starbasePlayer) => starbasePlayer.type === 'ok' && starbasePlayer.data
            );

            awaitRateLimit();
            var trackerBefore = await readFromRPCOrError(
                connection,
                sageProgram,
                sduTracker[0].key,
                SurveyDataUnitTracker,
                'processed',
            );

            const currentUnixTimestamp = Date.now() / 1000 | 0;
            for (var px = -50; px <= 50; px++) {
                for (var py = -50; py <= 50; py++) {
                    var sectorIndex = SurveyDataUnitTracker.findSectorIndex([new BN(px), new BN(py)]);
                    if (currentUnixTimestamp - trackerBefore.sectors[sectorIndex] <= 120
                    ) {
                        if (sduMap[sectorIndex].lastTimeMeasured < sduMapLastActualisation && trackerBefore.sectors[sectorIndex] > sduMapLastActualisation)
                            sduMap[sectorIndex].maxProb += (sduMap[sectorIndex].maxDirection != 0 ? sduMap[sectorIndex].maxDirection * 0.003 : 0.003);
                        if (currentUnixTimestamp - sduMap[sectorIndex].lastTimeMeasured > 3600) {
                            var distToMUD = calculateDistance([new BN(px), new BN(py)], [new BN(0), new BN(-39)]);
                            var distToONI = calculateDistance([new BN(px), new BN(py)], [new BN(-40), new BN(30)]);
                            var distToUST = calculateDistance([new BN(px), new BN(py)], [new BN(40), new BN(30)]);
                            var dampeningMod = 1;
                            if (distToMUD <= 30)
                                dampeningMod = (distToMUD / 30);
                            if (distToONI <= 30)
                                dampeningMod = (distToONI / 30);
                            if (distToUST <= 30)
                                dampeningMod = (distToUST / 30);

                            sduMap[sectorIndex].maxProb = probMax * dampeningMod;
                        }

                        sduMap[sectorIndex].probability = (currentUnixTimestamp - trackerBefore.sectors[sectorIndex]) * sduMap[sectorIndex].maxProb / 120;
                    }
                    else {
                        if (sduMapLastActualisation - trackerBefore.sectors[sectorIndex] < 120) {
                            sduMap[sectorIndex].probability = sduMap[sectorIndex].maxProb;
                            sduMap[sectorIndex].probability -= (currentUnixTimestamp - sduMapLastActualisation - trackerBefore.sectors[sectorIndex]) * 0.000033;
                        }
                        else
                            sduMap[sectorIndex].probability -= (currentUnixTimestamp - sduMapLastActualisation) * 0.000033;
                    }

                    if (sduMap[sectorIndex].probability > sduMap[sectorIndex].maxProb)
                        sduMap[sectorIndex].probability = sduMap[sectorIndex].maxProb;
                }
            }
            sduMapLastActualisation = currentUnixTimestamp;

            var blockingActionDone = false;

            // prefer the last served fleet
            if (focusedOrderIdx > -1 && focusedOrderIdx < orders.length) {
                if (focusedOrderIdx != orderSeq[0]) {
                    if (!focusedOrderOnHold) {
                        var idx = orderSeq.shift();
                        orderSeq.push(idx);
                    }
                    var oldIdx = orderSeq.findIndex((value) => value == focusedOrderIdx);
                    orderSeq.splice(oldIdx, 1);
                    orderSeq.unshift(focusedOrderIdx);
                }
            }
            else if (!focusedOrderOnHold) {
                var idx = orderSeq.shift();
                orderSeq.push(idx);
            }

            focusedOrderIdx = -1;
            myLog(`FleetOrder count ${orderSeq.length}`);

            for (var orderIdx = 0; orderIdx < orderSeq.length; orderIdx++) {
                var x = orderSeq[orderIdx];
                try {
                    const currentUnixTimestamp = Date.now() / 1000 | 0;

                    switch (orders[x].role) {
                        case 'Crafting': {
                            if (!orders[x].runningPromise) {
                                if (orders[x].auto) {
                                    let recipeGroup = recipes.filter(
                                        (recipe) => byteArrayToString(recipe.data.namespace) === orders[x].recipe
                                    );
                                    let recipe: Recipe;

                                    if (recipeGroup.length == 0)
                                        continue;
                                    else
                                        recipe = recipeGroup[0];

                                    var starbase = Starbase.findAddress(sageProgram, gameID, [new BN(orders[x].starbaseSector[0]), new BN(orders[x].starbaseSector[1])])[0];
                                    if (!starbase)
                                        break;

                                    awaitRateLimit();
                                    var starbaseAccount = await readFromRPCOrError(
                                        connection,
                                        sageProgram,
                                        starbase,
                                        Starbase,
                                        'processed',
                                    );
                                    var starbasePlayer = starbasePlayers.filter(
                                        (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === starbase.toBase58()
                                    )[0];

                                    var availableCrew = Number(starbasePlayer.data.totalCrew) - Number(starbasePlayer.data.busyCrew);
                                    myLog(`Recipe ${byteArrayToString(recipe.data.namespace)}, available crew ${availableCrew}`);

                                    let craftingInstance: CraftingInstance;
                                    let craftingProcess: CraftingProcess;
                                    awaitRateLimit();
                                    const craftingInstances = (await readAllFromRPC(connection, sageProgram, CraftingInstance, 'processed', [
                                        {
                                            memcmp: {
                                                offset: 8 + 1 + 2 + 8,
                                                bytes: starbasePlayer.key.toBase58(),
                                            },
                                        },
                                    ],)).map(
                                        (instance) => instance.type === 'ok' && instance.data
                                    );

                                    for (var procIdx = 0; procIdx < craftingInstances.length; procIdx++) {
                                        var craftingProcessAccount = await readFromRPCOrError(
                                            connection,
                                            craftingProgram,
                                            craftingInstances[procIdx].data.craftingProcess,
                                            CraftingProcess,
                                            'processed',
                                        );
                                        if (craftingProcessAccount.data.recipe.toBase58() === recipe.key.toBase58()) {
                                            craftingInstance = craftingInstances[procIdx];
                                            craftingProcess = craftingProcessAccount;
                                            break;
                                        }
                                    }

                                    awaitRateLimit();
                                    var craftingFacilityAccount = await readFromRPCOrError(
                                        connection,
                                        craftingProgram,
                                        starbaseAccount.data.craftingFacility,
                                        CraftingFacility,
                                        'processed',
                                    );

                                    var recipeCategoryIdx = craftingFacilityAccount.recipeCategories.findIndex(Facility => Facility.toBase58() === recipe.data.category.toBase58());

                                    if ((availableCrew >= orders[x].crew) && craftingProcess == undefined
                                        //start crafting
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Crew at ${byteArrayToString(starbaseAccount.data.name)} start crafting ${byteArrayToString(recipe.data.namespace)}`);
                                            const Ix: InstructionReturn[] = [];
                                            var breakAction = false;

                                            var craftingID = new BN(randomUint8Arr());
                                            Ix.push(CraftingInstance.createCraftingProcess(
                                                sageProgram,
                                                craftingProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                starbasePlayer.key,
                                                starbase,
                                                gameID,
                                                game.data.gameState,
                                                starbaseAccount.data.craftingFacility,
                                                recipe.key,
                                                craftingFacilityAccount.data.domain,
                                                {
                                                    keyIndex: 0,
                                                    craftingId: craftingID,
                                                    recipeCategoryIndex: recipeCategoryIdx,
                                                    quantity: new BN(orders[x].quantity),
                                                    numCrew: new BN(orders[x].crew),
                                                },
                                            ));

                                            const craftingProcessKey = CraftingProcess.findAddress(
                                                craftingProgram,
                                                starbaseAccount.data.craftingFacility,
                                                recipe.key,
                                                craftingID,
                                            )[0];
                                            myLog(`crafting process ${craftingProcessKey}`);
                                            const craftingInstanceKey = CraftingInstance.findAddress(
                                                sageProgram,
                                                starbasePlayer.key,
                                                craftingProcessKey,
                                            )[0];

                                            //starbase cargo pod
                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            //clean up too many pods
                                            if (starbaseCargoPods.length > 1) {
                                                await cleanStarbaseCargoPods(
                                                    walletSigner,
                                                    connection,
                                                    sageProgram,
                                                    cargoProgram,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    starbasePlayer.key,
                                                    game.data.gameState
                                                );
                                                awaitRateLimit();
                                                starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                    .map(
                                                        (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                    );
                                            }

                                            //get tokens in the cargo pod
                                            awaitRateLimit();
                                            const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                connection,
                                                starbaseCargoPods[0].key,
                                            );
                                            if (podTokenAccounts == undefined || podTokenAccounts.length == 0)
                                                breakAction = true;

                                            myLog(`recipe consumables count ${recipe.data.consumablesCount} non-consumables count ${recipe.data.nonConsumablesCount}`);

                                            if (!breakAction) {
                                                for (var l = 0; l < recipe.data.consumablesCount + recipe.data.nonConsumablesCount; l++) {
                                                    if (breakAction)
                                                        break;

                                                    var podTokenAccs = podTokenAccounts.filter(
                                                        (tokenAcc) => tokenAcc.mint.toBase58() === recipe.ingredientInputsOutputs[l].mint.toBase58()
                                                    );

                                                    if (podTokenAccs == undefined || podTokenAccs.length == 0) {
                                                        breakAction = true;
                                                        break;
                                                    }
                                                    else
                                                        var podToken = podTokenAccs[0];
                                                    myLog(`resource in sb ${Number(podToken.delegatedAmount)}`);

                                                    const ata = createAssociatedTokenAccount(recipe.ingredientInputsOutputs[l].mint, craftingProcessKey);
                                                    Ix.push(ata.instructions);

                                                    if (Number(podToken.delegatedAmount) >= Number(recipe.ingredientInputsOutputs[l].amount) * orders[x].quantity) {
                                                        Ix.push(CraftingInstance.depositCraftingIngredient(
                                                            sageProgram,
                                                            cargoProgram,
                                                            craftingProgram,
                                                            walletSigner,
                                                            primaryProfile.key,
                                                            factionKey,
                                                            starbasePlayer.key,
                                                            starbase,
                                                            craftingInstanceKey,
                                                            craftingProcessKey,
                                                            starbaseAccount.data.craftingFacility,
                                                            recipe.key,
                                                            starbaseCargoPods[0].key,
                                                            CargoType.findAddress(
                                                                cargoProgram,
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                recipe.ingredientInputsOutputs[l].mint,
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                            )[0],
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            podToken.address,
                                                            ata.address,
                                                            gameID,
                                                            game.data.gameState,
                                                            {
                                                                amount: new BN(Number(recipe.ingredientInputsOutputs[l].amount) * orders[x].quantity),
                                                                keyIndex: 0,
                                                                ingredientIndex: l,
                                                            },
                                                        ));
                                                    }
                                                    else {
                                                        breakAction = true;
                                                    }
                                                }

                                                if (!breakAction) {
                                                    awaitRateLimit();
                                                    const atlasTokenFrom = await getOrCreateAssociatedTokenAccount(
                                                        connection,
                                                        ATLAS,
                                                        walletSigner.publicKey(),
                                                        true,
                                                    );

                                                    awaitRateLimit();
                                                    const atlas = await getAccount(
                                                        connection,
                                                        atlasTokenFrom.address,
                                                        'processed',
                                                    );
                                                    if (Number(atlas.amount) / Math.pow(10, 8) < Number(recipe.data.feeAmount) / Math.pow(10, 8) * orders[x].quantity) {
                                                        myLog(`Not enough ATLAS to start crafting ${Number(atlas.amount) / Math.pow(10, 8)} - needed ${Number(recipe.data.feeAmount) / Math.pow(10, 8) * orders[x].quantity}`);
                                                        break;
                                                    }
                                                    const atlasTokenTo = recipe.data.feeRecipient != null ? recipe.data.feeRecipient.key : game.data.vaults.atlas;

                                                    Ix.push(CraftingInstance.startCraftingProcess(
                                                        sageProgram,
                                                        craftingProgram,
                                                        walletSigner,
                                                        primaryProfile.key,
                                                        factionKey,
                                                        starbasePlayer.key,
                                                        starbase,
                                                        craftingInstanceKey,
                                                        craftingProcessKey,
                                                        starbaseAccount.data.craftingFacility,
                                                        recipe.key,
                                                        gameID,
                                                        game.data.gameState,
                                                        {
                                                            keyIndex: 0,
                                                        },
                                                        walletSigner,
                                                        atlasTokenFrom.address,
                                                        atlasTokenTo,
                                                    ));
                                                }
                                            }

                                            if (Ix.length > 0 && !breakAction) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    console.log(err);
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                            orders[x].refreshData = false;
                                        }
                                    }
                                    else if ((craftingProcess != undefined && craftingProcess.data.status == 2 &&
                                        (Number(craftingProcess.data.endTime) - currentUnixTimestamp) <= randomWithinRange(-3, -1))
                                        //finish crafting
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Finish crafting ${byteArrayToString(recipe.data.namespace)}`);
                                            const Ix: InstructionReturn[] = [];

                                            for (var inIdx = 0; inIdx < recipe.data.consumablesCount; inIdx++) {
                                                const ata = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    recipe.ingredientInputsOutputs[inIdx].mint,
                                                    craftingProcess.key,
                                                    true,
                                                );

                                                Ix.push(CraftingProcess.burnConsumableIngredient(
                                                    craftingProgram,
                                                    craftingProcess.key,
                                                    recipe.key,
                                                    ata.address,
                                                    recipe.ingredientInputsOutputs[inIdx].mint,
                                                    {
                                                        ingredientIndex: inIdx,
                                                    },
                                                ));
                                            }

                                            //starbase cargo pod
                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            //clean up too many pods
                                            if (starbaseCargoPods.length > 1) {
                                                await cleanStarbaseCargoPods(
                                                    walletSigner,
                                                    connection,
                                                    sageProgram,
                                                    cargoProgram,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    starbasePlayer.key,
                                                    game.data.gameState
                                                );
                                                awaitRateLimit();
                                                starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                    .map(
                                                        (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                    );
                                            }

                                            //get tokens in the cargo pod
                                            awaitRateLimit();
                                            const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                connection,
                                                starbaseCargoPods[0].key,
                                            );

                                            //claim nonconsumables
                                            for (var ncIdx = recipe.data.consumablesCount; ncIdx < recipe.data.consumablesCount + recipe.data.nonConsumablesCount; ncIdx++) {

                                                const podTokenAcc = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    recipe.ingredientInputsOutputs[ncIdx].mint,
                                                    starbaseCargoPods[0].key,
                                                    true,
                                                );
                                                if (podTokenAcc.instructions != null) {
                                                    Ix.push(podTokenAcc.instructions);
                                                }

                                                const ata = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    recipe.ingredientInputsOutputs[ncIdx].mint,
                                                    craftingProcess.key,
                                                    true,
                                                );

                                                Ix.push(CraftingInstance.claimCraftingNonConsumables(
                                                    sageProgram,
                                                    cargoProgram,
                                                    craftingProgram,
                                                    starbasePlayer.key,
                                                    starbase,
                                                    craftingInstance.key,
                                                    craftingProcess.key,
                                                    recipe.key,
                                                    starbaseCargoPods[0].key,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        recipe.ingredientInputsOutputs[ncIdx].mint,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    ata.address,
                                                    podTokenAcc.address,
                                                    recipe.ingredientInputsOutputs[ncIdx].mint,
                                                    { ingredientIndex: ncIdx },
                                                ));
                                            }

                                            //claim outputs
                                            for (var outIdx = recipe.data.consumablesCount + recipe.data.nonConsumablesCount; outIdx < recipe.data.totalCount; outIdx++) {
                                                const craftableItemKey = CraftableItem.findAddress(
                                                    craftingProgram,
                                                    craftingFacilityAccount.data.domain,
                                                    recipe.ingredientInputsOutputs[outIdx].mint,
                                                )[0];
                                                const craftableItemTokenAcc = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    recipe.ingredientInputsOutputs[outIdx].mint,
                                                    craftableItemKey,
                                                    true,
                                                );

                                                const podTokenAcc = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    recipe.ingredientInputsOutputs[outIdx].mint,
                                                    starbaseCargoPods[0].key,
                                                    true,
                                                );
                                                if (podTokenAcc.instructions != null) {
                                                    Ix.push(podTokenAcc.instructions);
                                                }

                                                Ix.push(CraftingInstance.claimCraftingOutputs(
                                                    sageProgram,
                                                    cargoProgram,
                                                    craftingProgram,
                                                    starbasePlayer.key,
                                                    starbase,
                                                    craftingInstance.key,
                                                    craftingProcess.key,
                                                    recipe.key,
                                                    craftableItemKey,
                                                    starbaseCargoPods[0].key,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        recipe.ingredientInputsOutputs[outIdx].mint,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    craftableItemTokenAcc.address,
                                                    podTokenAcc.address,
                                                    { ingredientIndex: outIdx },
                                                ));
                                            }

                                            Ix.push(CraftingInstance.closeCraftingProcess(
                                                sageProgram,
                                                craftingProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                'funder',
                                                starbasePlayer.key,
                                                starbase,
                                                craftingInstance.key,
                                                craftingProcess.key,
                                                starbaseAccount.data.craftingFacility,
                                                recipe.key,
                                                gameID,
                                                game.data.gameState,
                                                {
                                                    keyIndex: 0,
                                                },
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                    var result = await sendDynamicTransaction(Ix, walletSigner, connection);
                                                }
                                                catch (err) {
                                                    console.log(err);
                                                    myLog(err.message);
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                            }
                                            orders[x].refreshData = true;

                                            myLog(``);
                                        }
                                    }
                                    else
                                        orders[x].refreshData = true;
                                }
                            }
                            else if (x == 0)
                                focusedOrderOnHold = true;

                            break;
                        }
                        case 'Freighter': {
                            if (!orders[x].runningPromise) {
                                let fleetGroup = fleets.filter(
                                    (fleet) => byteArrayToString(fleet.data.fleetLabel) === orders[x].fleetLabel
                                );
                                let fleet: Fleet;

                                if (fleetGroup.length == 0)
                                    continue;
                                else
                                    fleet = fleetGroup[0];

                                if (orders[x].auto) {
                                    if (orders[x].refreshData || orders[x].fuelAccount == undefined || orders[x].fuel == undefined ||
                                        orders[x].ammoBankAccount == undefined ||
                                        orders[x].sector == undefined ||
                                        orders[x].cargoPodTokenAccounts == undefined
                                        //get actual accounts state
                                    ) {
                                        myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} data refresh ${orders[x].refreshData}`);
                                        const Ix: InstructionReturn[] = [];

                                        awaitRateLimit();
                                        orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            FUEL,
                                            fleet.data.fuelTank,
                                            true,
                                        );
                                        if (orders[x].fuelAccount.instructions != null) {
                                            myLog(`no account fuel`);
                                            Ix.push(orders[x].fuelAccount.instructions);
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].fuel = await getAccount(
                                                connection,
                                                orders[x].fuelAccount.address,
                                                'processed',
                                            );
                                        }

                                        if (fleet.state.Idle)
                                            orders[x].sector = fleet.state.Idle.sector;
                                        else if (fleet.state.MoveSubwarp)
                                            orders[x].sector = fleet.state.MoveSubwarp.currentSector;
                                        else if (fleet.state.MoveWarp)
                                            orders[x].sector = fleet.state.MoveWarp.toSector;
                                        else if (fleet.state.Respawn)
                                            orders[x].sector = fleet.state.Respawn.sector;
                                        else if (fleet.state.StarbaseLoadingBay) {
                                            awaitRateLimit();
                                            var starbaseAccount = await readFromRPCOrError(
                                                connection,
                                                sageProgram,
                                                fleet.state.StarbaseLoadingBay.starbase,
                                                Starbase,
                                                'processed',
                                            );
                                            orders[x].sector = starbaseAccount.data.sector;
                                        }
                                        else if (fleet.state.MineAsteroid) {
                                            awaitRateLimit();
                                            var asteroidAccount = await readFromRPCOrError(
                                                connection,
                                                sageProgram,
                                                fleet.state.MineAsteroid.asteroid,
                                                Planet,
                                                'processed',
                                            );
                                            orders[x].sector = asteroidAccount.data.sector;
                                        }

                                        awaitRateLimit();
                                        orders[x].ammoBankAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            AMMO,
                                            fleet.data.ammoBank,
                                            true,
                                        );
                                        if (orders[x].ammoBankAccount.instructions != null) {
                                            myLog(`no account ammo`);
                                            Ix.push(orders[x].ammoBankAccount.instructions);
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].ammo = await getAccount(
                                                connection,
                                                orders[x].ammoBankAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        orders[x].cargoPodTokenAccounts = await betterGetTokenAccountsByOwner(
                                            connection,
                                            fleet.data.cargoHold,
                                        );

                                        awaitRateLimit();
                                        var cargoPod = await readFromRPCOrError(
                                            connection,
                                            cargoProgram,
                                            fleet.data.cargoHold,
                                            CargoPod,
                                            'processed',
                                        );

                                        orders[x].cargoSpaceAvailable = (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - getUsedCargoSpace(cargoPod).toNumber();

                                        orders[x].cargoToBaseState = false;
                                        orders[x].cargoToDestinationState = false;
                                        orders[x].cargoErrorState = false;

                                        var cargoToBaseState = false;
                                        var cargoToDestinationState = false;
                                        var cargoErrorState = false;

                                        if (Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) > 0) {
                                            if (orders[x].cargoToBase != undefined && orders[x].cargoToBase.length > 0) {
                                                for (let j = 0; j < orders[x].cargoToBase.length; j++) {
                                                    if (getMint(orders[x].cargoToBase[j].name) != undefined && getMint(orders[x].cargoToBase[j].name).toBase58() == AMMO.toBase58() &&
                                                        orders[x].cargoToBase[j].necessary
                                                    ) {
                                                        if (cargoToDestinationState) {
                                                            cargoErrorState = true;
                                                        }
                                                        else {
                                                            cargoToBaseState = true;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                            else if ((fleet.state.Idle ||
                                                !(orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1])) &&
                                                orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity
                                            ) {
                                                cargoToBaseState = true;
                                            }


                                            if (orders[x].cargoToDestination != undefined && orders[x].cargoToDestination.length > 0) {
                                                for (let j = 0; j < orders[x].cargoToDestination.length; j++) {
                                                    if (getMint(orders[x].cargoToDestination[j].name) != undefined && getMint(orders[x].cargoToDestination[j].name).toBase58() == AMMO.toBase58() &&
                                                        orders[x].cargoToDestination[j].necessary
                                                    ) {
                                                        if (cargoToBaseState) {
                                                            cargoErrorState = true;
                                                        }
                                                        else {
                                                            cargoToDestinationState = true;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                            else if ((fleet.state.Idle ||
                                                !(orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1])) &&
                                                orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity &&
                                                Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity
                                            ) {
                                                cargoToDestinationState = true;
                                            }
                                        }

                                        if (orders[x].cargoPodTokenAccounts.length > 0) {
                                            for (let i = 0; i < orders[x].cargoPodTokenAccounts.length; i++) {
                                                const tokenData = orders[x].cargoPodTokenAccounts[i];

                                                if (orders[x].cargoToBase != undefined && orders[x].cargoToBase.length > 0) {
                                                    for (let j = 0; j < orders[x].cargoToBase.length; j++) {
                                                        if (getMint(orders[x].cargoToBase[j].name) != undefined && getMint(orders[x].cargoToBase[j].name).toBase58() == tokenData.mint.toBase58() &&
                                                            Number(tokenData.delegatedAmount) > 0 && orders[x].cargoToBase[j].necessary
                                                        ) {
                                                            if (cargoToDestinationState) {
                                                                cargoErrorState = true;
                                                            }
                                                            else {
                                                                cargoToBaseState = true;
                                                            }
                                                            break;
                                                        }
                                                    }
                                                }
                                                else if ((fleet.state.Idle ||
                                                    !(orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1])) &&
                                                    orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity
                                                ) {
                                                    cargoToBaseState = true;
                                                }


                                                if (orders[x].cargoToDestination != undefined && orders[x].cargoToDestination.length > 0) {
                                                    for (let j = 0; j < orders[x].cargoToDestination.length; j++) {
                                                        if (getMint(orders[x].cargoToDestination[j].name) != undefined && getMint(orders[x].cargoToDestination[j].name).toBase58() == tokenData.mint.toBase58() &&
                                                            Number(tokenData.delegatedAmount) > 0 && orders[x].cargoToDestination[j].necessary
                                                        ) {
                                                            if (cargoToBaseState) {
                                                                cargoErrorState = true;
                                                            }
                                                            else {
                                                                cargoToDestinationState = true;
                                                            }
                                                            break;
                                                        }
                                                    }
                                                }
                                                else if ((fleet.state.Idle ||
                                                    !(orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1])) &&
                                                    orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity &&
                                                    Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity
                                                ) {
                                                    cargoToDestinationState = true;
                                                }
                                            }
                                            if (cargoToDestinationState && (orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1]) &&
                                                Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity) {
                                                cargoToBaseState = false;
                                                cargoToDestinationState = false;
                                                cargoErrorState = true;
                                            }
                                            if (cargoErrorState || (!cargoToBaseState && !cargoToDestinationState)) {
                                                orders[x].cargoToBaseState = false;
                                                orders[x].cargoToDestinationState = false;
                                                orders[x].cargoErrorState = cargoErrorState;
                                            }
                                            else {
                                                orders[x].cargoToBaseState = cargoToBaseState;
                                                orders[x].cargoToDestinationState = cargoToDestinationState;
                                                orders[x].cargoErrorState = false;
                                            }
                                            myLog(`Cargo to base: ${orders[x].cargoToBaseState}, Cargo to destination: ${orders[x].cargoToDestinationState}, ${cargoErrorState} `);
                                        }

                                        if (Ix.length > 0) {
                                            try {
                                                executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                orders[x].refreshData = true;
                                                if (!blockingActionDone) {
                                                    blockingActionDone = true;
                                                    focusedOrderIdx = x;
                                                }
                                                break;
                                            }
                                            catch (err) {
                                                myLog(err.message);
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        else {
                                            myLog(`no Ix`);
                                            orders[x].refreshData = false;
                                        }
                                    }

                                    if (fleet.state.Idle &&
                                        (((orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1]) &&
                                            (orders[x].cargoToDestinationState || orders[x].cargoErrorState)) ||
                                            ((orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1]) &&
                                                (orders[x].cargoToBaseState || orders[x].cargoErrorState))
                                        )
                                        // start docking
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} should start docking`);
                                            const Ix: InstructionReturn[] = [];
                                            var starbase = Starbase.findAddress(sageProgram, gameID, fleet.state.Idle.sector as [BN, BN])[0];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            Ix.push(Fleet.idleToLoadingBay(
                                                sageProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                fleet.key,
                                                starbase,
                                                starbasePlayer.key,
                                                gameID,
                                                game.data.gameState,
                                                0
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                }
                                                orders[x].refreshData = true;
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay &&
                                        (((orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1]) &&
                                            (orders[x].cargoToDestinationState || orders[x].cargoErrorState)) ||
                                            ((orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1]) &&
                                                (orders[x].cargoToBaseState || orders[x].cargoErrorState))
                                        )
                                        // unloading goods
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} unloading goods`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            if (starbaseCargoPods.length == 0) {
                                                const podSeedBuffer = Keypair.generate().publicKey.toBuffer();
                                                const podSeeds = Array.from(podSeedBuffer);
                                                Ix.push(StarbasePlayer.createCargoPod(
                                                    sageProgram,
                                                    cargoProgram,
                                                    starbasePlayer.key,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        keyIndex: 0,
                                                        podSeeds
                                                    }
                                                ));
                                                try {
                                                    var result = await sendDynamicTransaction(Ix, walletSigner, connection);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }

                                                break;
                                            }

                                            if (orders[x].cargoPodTokenAccounts.length > 0) {
                                                for (let i = 0; i < orders[x].cargoPodTokenAccounts.length; i++) {
                                                    const tokenData = orders[x].cargoPodTokenAccounts[i];

                                                    awaitRateLimit();
                                                    var someAccountTo = await getOrCreateAssociatedTokenAccount(
                                                        connection,
                                                        tokenData.mint,
                                                        starbaseCargoPods[0].key,
                                                        true,
                                                    );
                                                    if (someAccountTo.instructions != null) {
                                                        Ix.push(someAccountTo.instructions);
                                                    }
                                                    if (Number(tokenData.delegatedAmount) > 0) {
                                                        Ix.push(Fleet.withdrawCargoFromFleet(
                                                            sageProgram,
                                                            cargoProgram,
                                                            walletSigner,
                                                            'funder',
                                                            primaryProfile.key,
                                                            factionKey,
                                                            fleet.state.StarbaseLoadingBay.starbase,
                                                            starbasePlayer.key,
                                                            fleet.key,
                                                            fleet.data.cargoHold,
                                                            starbaseCargoPods[0].key,
                                                            CargoType.findAddress(
                                                                cargoProgram,
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                tokenData.mint,
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                            )[0],
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            tokenData.address,
                                                            someAccountTo.address,
                                                            tokenData.mint,
                                                            gameID,
                                                            game.data.gameState,
                                                            {
                                                                amount: new BN(tokenData.delegatedAmount),
                                                                keyIndex: 0
                                                            }));
                                                        orders[x].refreshData = true;
                                                    }
                                                }
                                            }

                                            awaitRateLimit();
                                            orders[x].ammoBankAccount = await getOrCreateAssociatedTokenAccount(
                                                connection,
                                                AMMO,
                                                fleet.data.ammoBank,
                                                true,
                                            );
                                            if (orders[x].ammoBankAccount.instructions != null) {
                                                myLog(`no account ammo`);
                                                Ix.push(orders[x].ammoBankAccount.instructions);
                                            }
                                            else {
                                                awaitRateLimit();
                                                orders[x].ammo = await getAccount(
                                                    connection,
                                                    orders[x].ammoBankAccount.address,
                                                    'processed',
                                                );
                                            }

                                            if (Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) > 0) {
                                                awaitRateLimit();
                                                var someAccountTo = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    AMMO,
                                                    starbaseCargoPods[0].key,
                                                    true,
                                                );
                                                if (someAccountTo.instructions != null) {
                                                    Ix.push(someAccountTo.instructions);
                                                }

                                                Ix.push(Fleet.withdrawCargoFromFleet(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    'funder',
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    starbasePlayer.key,
                                                    fleet.key,
                                                    fleet.data.ammoBank,
                                                    starbaseCargoPods[0].key,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        AMMO,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    orders[x].ammoBankAccount.address,
                                                    someAccountTo.address,
                                                    AMMO,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        amount: new BN(orders[x].ammo.delegatedAmount),
                                                        keyIndex: 0
                                                    }));
                                                orders[x].refreshData = true;
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                orders[x].cargoToBaseState = false;
                                                orders[x].cargoToDestinationState = false;
                                                orders[x].cargoErrorState = false;
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay &&
                                        (((orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1]) &&
                                            !orders[x].cargoToBaseState) ||
                                            ((orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1]) &&
                                                !orders[x].cargoToDestinationState)
                                        )
                                        //load supplies
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} loading supplies`);
                                            const Ix: InstructionReturn[] = [];
                                            var breakAction = false;

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            if (starbaseCargoPods.length > 1) {
                                                await cleanStarbaseCargoPods(
                                                    walletSigner,
                                                    connection,
                                                    sageProgram,
                                                    cargoProgram,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    starbasePlayer.key,
                                                    game.data.gameState
                                                );
                                                awaitRateLimit();
                                                starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                    .map(
                                                        (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                    );
                                            }

                                            awaitRateLimit();
                                            const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                connection,
                                                starbaseCargoPods[0].key,
                                            );

                                            var base = orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1];
                                            var destination = orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1];

                                            if ((!base && !destination) || podTokenAccounts == undefined || podTokenAccounts.length == 0)
                                                breakAction = true;

                                            if (base && !breakAction) {

                                                var fuelPod: CargoPod;
                                                var fuelToken;
                                                var fuelInStarbase = 0;

                                                if (podTokenAccounts.length > 0) {
                                                    for (let i = 0; i < podTokenAccounts.length; i++) {
                                                        const tokenData = podTokenAccounts[i];
                                                        if (tokenData.mint.toBase58() === FUEL.toBase58()) {
                                                            fuelInStarbase = Number(tokenData.delegatedAmount);
                                                            fuelPod = starbaseCargoPods[0];
                                                            fuelToken = tokenData;
                                                            break;
                                                        }
                                                    }
                                                }

                                                if (fuelToken != undefined && Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity &&
                                                    fuelInStarbase >= (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0)
                                                ) {
                                                    var freightFuelAmount = (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0);

                                                    if (freightFuelAmount > 0) {
                                                        Ix.push(Fleet.depositCargoToFleet(
                                                            sageProgram,
                                                            cargoProgram,
                                                            walletSigner,
                                                            primaryProfile.key,
                                                            factionKey,
                                                            'funder',
                                                            fleet.state.StarbaseLoadingBay.starbase,
                                                            starbasePlayer.key,
                                                            fleet.key,
                                                            fuelPod.key,
                                                            fleet.data.fuelTank,
                                                            CargoType.findAddress(
                                                                cargoProgram,
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                FUEL,
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                            )[0],
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            fuelToken.address,
                                                            orders[x].fuelAccount.address,
                                                            FUEL,
                                                            gameID,
                                                            game.data.gameState,
                                                            {
                                                                amount: new BN(freightFuelAmount),
                                                                keyIndex: 0
                                                            }
                                                        ));
                                                        fuelInStarbase -= freightFuelAmount;
                                                    }
                                                    orders[x].refreshData = true;
                                                }
                                                else if (fuelInStarbase < (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0))
                                                    breakAction = true;
                                            }

                                            var flipflop = true;
                                            for (let k = 0; k <= 1; k++) {
                                                if (!breakAction) {
                                                    var necessaryCargo = undefined;
                                                    if (base && orders[x].cargoToDestination != undefined)
                                                        var necessaryCargo = orders[x].cargoToDestination.filter(
                                                            (cargo) => cargo.necessary == flipflop
                                                        );
                                                    if (destination && orders[x].cargoToBase != undefined)
                                                        var necessaryCargo = orders[x].cargoToBase.filter(
                                                            (cargo) => cargo.necessary == flipflop
                                                        );

                                                    if (necessaryCargo != undefined) {
                                                        for (let j = 0; j < necessaryCargo.length; j++) {
                                                            if (breakAction)
                                                                break;
                                                            if (getMint(necessaryCargo[j].name) == undefined)
                                                                continue;
                                                            if (orders[x].cargoSpaceAvailable <= 0 && necessaryCargo[j].name != 'Ammunition')
                                                                continue;

                                                            var someCargoAmount = 0;
                                                            var ammoBankAmount = 0;
                                                            if (necessaryCargo[j].name != 'Ammunition') {
                                                                awaitRateLimit();
                                                                var someCargoAccount = await getOrCreateAssociatedTokenAccount(
                                                                    connection,
                                                                    getMint(necessaryCargo[j].name),
                                                                    fleet.data.cargoHold,
                                                                    true,
                                                                );
                                                                if (someCargoAccount.instructions != null) {
                                                                    myLog(`no account ${necessaryCargo[j].name}`);
                                                                    Ix.push(someCargoAccount.instructions);
                                                                }
                                                                else {
                                                                    awaitRateLimit();
                                                                    someCargoAmount = Number((await getAccount(
                                                                        connection,
                                                                        someCargoAccount.address,
                                                                        'processed',
                                                                    )).delegatedAmount);
                                                                }
                                                            }
                                                            else {
                                                                awaitRateLimit();
                                                                var someAmmoAccount = await getOrCreateAssociatedTokenAccount(
                                                                    connection,
                                                                    getMint(necessaryCargo[j].name),
                                                                    fleet.data.ammoBank,
                                                                    true,
                                                                );
                                                                if (someAmmoAccount.instructions != null) {
                                                                    myLog(`no account ${necessaryCargo[j].name} in ammo bank`);
                                                                    Ix.push(someAmmoAccount.instructions);
                                                                }
                                                                else {
                                                                    awaitRateLimit();
                                                                    ammoBankAmount = Number((await getAccount(
                                                                        connection,
                                                                        someAmmoAccount.address,
                                                                        'processed',
                                                                    )).delegatedAmount);
                                                                }
                                                                awaitRateLimit();
                                                                var someCargoAccount = await getOrCreateAssociatedTokenAccount(
                                                                    connection,
                                                                    getMint(necessaryCargo[j].name),
                                                                    fleet.data.cargoHold,
                                                                    true,
                                                                );
                                                                if (someCargoAccount.instructions != null) {
                                                                    myLog(`no account ${necessaryCargo[j].name}`);
                                                                    Ix.push(someCargoAccount.instructions);
                                                                }
                                                                else {
                                                                    awaitRateLimit();
                                                                    someCargoAmount = Number((await getAccount(
                                                                        connection,
                                                                        someCargoAccount.address,
                                                                        'processed',
                                                                    )).delegatedAmount);
                                                                }
                                                            }

                                                            var found = false;
                                                            for (let i = 0; i < podTokenAccounts.length; i++) {
                                                                if (breakAction)
                                                                    break;
                                                                if (getMint(necessaryCargo[j].name) != undefined && podTokenAccounts[i].mint.toBase58() === getMint(necessaryCargo[j].name).toBase58()) {
                                                                    myLog(`found ${necessaryCargo[j].name}, amount in starbase ${Number(podTokenAccounts[i].delegatedAmount)}, need ${necessaryCargo[j].amount - someCargoAmount - ammoBankAmount}`);

                                                                    var cargo = CargoType.findAddress(
                                                                        cargoProgram,
                                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                        podTokenAccounts[i].mint,
                                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                                    )[0];
                                                                    awaitRateLimit();
                                                                    const cargoItemAcc = await readFromRPCOrError(
                                                                        connection,
                                                                        cargoProgram,
                                                                        cargo,
                                                                        CargoType,
                                                                        'processed',
                                                                    );

                                                                    var ammoInStarbase = 0;

                                                                    if (necessaryCargo[j].name == 'Ammunition' &&
                                                                        (Number(podTokenAccounts[i].delegatedAmount) >= 1) &&
                                                                        (Number(podTokenAccounts[i].delegatedAmount) >= necessaryCargo[j].amount - someCargoAmount - ammoBankAmount) &&
                                                                        (ammoBankAmount < (<ShipStats>fleet.data.stats).cargoStats.ammoCapacity)
                                                                    ) {
                                                                        var ammoInStarbase = Number(podTokenAccounts[i].delegatedAmount);
                                                                        var transferAmmoBankAmount = necessaryCargo[j].amount > (<ShipStats>fleet.data.stats).cargoStats.ammoCapacity ? (<ShipStats>fleet.data.stats).cargoStats.ammoCapacity - ammoBankAmount : necessaryCargo[j].amount - ammoBankAmount;
                                                                        myLog(`Ammo to ammoBank ${transferAmmoBankAmount}`);
                                                                        if (transferAmmoBankAmount > 0) {
                                                                            Ix.push(Fleet.depositCargoToFleet(
                                                                                sageProgram,
                                                                                cargoProgram,
                                                                                walletSigner,
                                                                                primaryProfile.key,
                                                                                factionKey,
                                                                                'funder',
                                                                                fleet.state.StarbaseLoadingBay.starbase,
                                                                                starbasePlayer.key,
                                                                                fleet.key,
                                                                                starbaseCargoPods[0].key,
                                                                                fleet.data.ammoBank,
                                                                                CargoType.findAddress(
                                                                                    cargoProgram,
                                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                                    getMint(necessaryCargo[j].name),
                                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                                                )[0],
                                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                                podTokenAccounts[i].address,
                                                                                someAmmoAccount.address,
                                                                                getMint(necessaryCargo[j].name),
                                                                                gameID,
                                                                                game.data.gameState,
                                                                                {
                                                                                    amount: new BN(transferAmmoBankAmount),
                                                                                    keyIndex: 0
                                                                                }
                                                                            ));
                                                                            ammoBankAmount += transferAmmoBankAmount;
                                                                            ammoInStarbase -= transferAmmoBankAmount;
                                                                            orders[x].refreshData = true;
                                                                        }
                                                                    }

                                                                    var starbaseAmount = necessaryCargo[j].name == 'Ammunition' ? ammoInStarbase : Number(podTokenAccounts[i].delegatedAmount);
                                                                    if ((starbaseAmount >= necessaryCargo[j].amount - someCargoAmount - ammoBankAmount &&
                                                                        orders[x].cargoSpaceAvailable >= Number(getCargoSpaceUsedByTokenAmount(cargoItemAcc, new BN(necessaryCargo[j].amount - someCargoAmount))) && flipflop) ||
                                                                        (starbaseAmount >= 1 &&
                                                                            orders[x].cargoSpaceAvailable >= Number(getCargoSpaceUsedByTokenAmount(cargoItemAcc, new BN(1))) && !flipflop)
                                                                    ) {
                                                                        var transferCargoAmount = starbaseAmount >= necessaryCargo[j].amount - someCargoAmount - ammoBankAmount ?
                                                                            (orders[x].cargoSpaceAvailable >= Number(getCargoSpaceUsedByTokenAmount(cargoItemAcc, new BN(necessaryCargo[j].amount - someCargoAmount - ammoBankAmount))) ?
                                                                                Number(necessaryCargo[j].amount - someCargoAmount - ammoBankAmount) :
                                                                                Number(getTokenAmountToTeachTargetStat(cargoItemAcc, new BN(orders[x].cargoSpaceAvailable)))) :
                                                                            (orders[x].cargoSpaceAvailable >= Number(getCargoSpaceUsedByTokenAmount(cargoItemAcc, new BN(starbaseAmount))) ?
                                                                                starbaseAmount :
                                                                                Number(getTokenAmountToTeachTargetStat(cargoItemAcc, new BN(orders[x].cargoSpaceAvailable))));
                                                                        myLog(`${necessaryCargo[j].name} to cargoHold ${transferCargoAmount}`);
                                                                        if (transferCargoAmount > 0) {
                                                                            Ix.push(Fleet.depositCargoToFleet(
                                                                                sageProgram,
                                                                                cargoProgram,
                                                                                walletSigner,
                                                                                primaryProfile.key,
                                                                                factionKey,
                                                                                'funder',
                                                                                fleet.state.StarbaseLoadingBay.starbase,
                                                                                starbasePlayer.key,
                                                                                fleet.key,
                                                                                starbaseCargoPods[0].key,
                                                                                fleet.data.cargoHold,
                                                                                CargoType.findAddress(
                                                                                    cargoProgram,
                                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                                    getMint(necessaryCargo[j].name),
                                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                                                )[0],
                                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                                podTokenAccounts[i].address,
                                                                                someCargoAccount.address,
                                                                                getMint(necessaryCargo[j].name),
                                                                                gameID,
                                                                                game.data.gameState,
                                                                                {
                                                                                    amount: new BN(transferCargoAmount),
                                                                                    keyIndex: 0
                                                                                }
                                                                            ));
                                                                            orders[x].cargoSpaceAvailable -= Number(getCargoSpaceUsedByTokenAmount(cargoItemAcc, new BN(transferCargoAmount)));
                                                                            orders[x].refreshData = true;
                                                                        }
                                                                    }
                                                                    else if (flipflop)
                                                                        breakAction = true;

                                                                    found = true;
                                                                    break;
                                                                }
                                                            }
                                                            if (!found && flipflop)
                                                                breakAction = true;
                                                        }
                                                    }
                                                }
                                                flipflop = false;
                                            }


                                            if (Ix.length > 0 && !breakAction) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay &&
                                        (((orders[x].sector[0] == orders[x].destinationSector[0] && orders[x].sector[1] == orders[x].destinationSector[1]) &&
                                            orders[x].cargoToBaseState && !orders[x].cargoErrorState) ||
                                            ((orders[x].sector[0] == orders[x].baseSector[0] && orders[x].sector[1] == orders[x].baseSector[1]) &&
                                                orders[x].cargoToDestinationState && !orders[x].cargoErrorState)
                                        )
                                        // undocking
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} commence undock`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            Ix.push(Fleet.loadingBayToIdle(
                                                sageProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                fleet.key,
                                                fleet.state.StarbaseLoadingBay.starbase,
                                                starbasePlayer.key,
                                                gameID,
                                                game.data.gameState,
                                                0
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.Idle &&
                                        (((orders[x].sector[0] != orders[x].baseSector[0] || orders[x].sector[1] != orders[x].baseSector[1]) &&
                                            orders[x].cargoToBaseState && !orders[x].cargoErrorState) ||
                                            ((orders[x].sector[0] != orders[x].destinationSector[0] || orders[x].sector[1] != orders[x].destinationSector[1]) &&
                                                orders[x].cargoToDestinationState && !orders[x].cargoErrorState))
                                        //move
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} coords ${fleet.state.Idle.sector[0]}, ${fleet.state.Idle.sector[1]}`);

                                            var route = (orders[x].cargoToBaseState ? orders[x].routeToBase : orders[x].routeToDestination);
                                            var coordinatesTarget: BN[];
                                            var warp = false;
                                            try {
                                                for (let i = 0; i < route.length; i++) {
                                                    if (orders[x].sector[0] == route[i].from[0] && orders[x].sector[1] == route[i].from[1]) {
                                                        coordinatesTarget = [new BN(route[i].to[0]), new BN(route[i].to[1])];
                                                        warp = route[i].warp;
                                                        break;
                                                    }
                                                }
                                            }
                                            catch (err) {
                                                myLog(err.message);
                                                break;
                                            }

                                            myLog(`need to move to ${coordinatesTarget[0]}, ${coordinatesTarget[1]}`);

                                            const Ix: InstructionReturn[] = [];

                                            if (warp && fleet.data.warpCooldownExpiresAt.toNumber() - currentUnixTimestamp > randomWithinRange(-3, -1)) {
                                                myLog(`Waiting for Warp cooldown ${fleet.data.warpCooldownExpiresAt.toNumber() - currentUnixTimestamp}s`);
                                                break;
                                            }

                                            awaitRateLimit();
                                            orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                                connection,
                                                FUEL,
                                                fleet.data.fuelTank,
                                                true,
                                            );
                                            if (orders[x].fuelAccount.instructions != null) {
                                                myLog(`no account fuel`);
                                                Ix.push(orders[x].fuelAccount.instructions);
                                            }
                                            else {
                                                awaitRateLimit();
                                                orders[x].fuel = await getAccount(
                                                    connection,
                                                    orders[x].fuelAccount.address,
                                                    'processed',
                                                );
                                            }

                                            if (warp) {
                                                if (orders[x].fuel.delegatedAmount >= Fleet.calculateWarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], coordinatesTarget as [BN, BN])) {
                                                    Ix.push(Fleet.warpToCoordinate(
                                                        sageProgram,
                                                        walletSigner,
                                                        primaryProfile.key,
                                                        factionKey,
                                                        fleet.key,
                                                        fleet.data.fuelTank,
                                                        CargoType.findAddress(
                                                            cargoProgram,
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            FUEL,
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                        )[0],
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        orders[x].fuelAccount.address,
                                                        FUEL,
                                                        game.data.gameState,
                                                        gameID,
                                                        cargoProgram,
                                                        {
                                                            toSector: coordinatesTarget,
                                                            keyIndex: 0,
                                                        },
                                                    ));
                                                }
                                                else
                                                    myLog(`not enough fuel to warp to ${coordinatesTarget[0]}, ${coordinatesTarget[1]}`);
                                            }
                                            else {
                                                if (orders[x].fuel.delegatedAmount >= Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], coordinatesTarget as [BN, BN])) {
                                                    Ix.push(Fleet.startSubwarp(
                                                        sageProgram,
                                                        walletSigner,
                                                        primaryProfile.key,
                                                        factionKey,
                                                        fleet.key,
                                                        gameID,
                                                        game.data.gameState,
                                                        {
                                                            toSector: coordinatesTarget,
                                                            keyIndex: 0,
                                                        },
                                                    ));
                                                }
                                                else
                                                    myLog(`not enough fuel to move to ${coordinatesTarget[0]}, ${coordinatesTarget[1]}`);
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransaction(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.MoveSubwarp
                                        //end subwarp
                                    ) {
                                        if (fleet.state.MoveSubwarp.arrivalTime - currentUnixTimestamp < randomWithinRange(-6, 0)) {
                                            {
                                                myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} arrived, stopping `);

                                                const Ix: InstructionReturn[] = [];

                                                awaitRateLimit();
                                                orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    FUEL,
                                                    fleet.data.fuelTank,
                                                    true,
                                                );
                                                if (orders[x].fuelAccount.instructions != null) {
                                                    myLog(`no account fuel`);
                                                    Ix.push(orders[x].fuelAccount.instructions);
                                                }

                                                awaitRateLimit();
                                                const fleetAccountInfo = await connection.getAccountInfo(
                                                    fleet.key,
                                                );

                                                const sectorFrom = Sector.findAddress(sageProgram, gameID, fleet.state.MoveSubwarp.fromSector as [BN, BN]);
                                                const sectorTo = Sector.findAddress(sageProgram, gameID, fleet.state.MoveSubwarp.toSector as [BN, BN]);

                                                Ix.push(Fleet.movementHandler(
                                                    sageProgram,
                                                    primaryProfile.key,
                                                    gameID,
                                                    game.data.gameState,
                                                    fleet.key,
                                                    fleetAccountInfo,
                                                    sectorFrom[0],
                                                    sectorTo[0],
                                                    fleet.data.fuelTank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FUEL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    orders[x].fuelAccount.address,
                                                    FUEL,
                                                    cargoProgram,
                                                ));

                                                Ix.push(Fleet.stopSubwarp(
                                                    sageProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    fleet.data.fuelTank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FUEL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    orders[x].fuelAccount.address,
                                                    FUEL,
                                                    gameID,
                                                    game.data.gameState,
                                                    cargoProgram,
                                                    { keyIndex: 0 },
                                                ));

                                                if (Ix.length > 0) {
                                                    try {
                                                        executeGenericTransaction(Ix, walletSigner, connection, x);
                                                    }
                                                    catch (err) {
                                                        myLog(err.message);
                                                    }
                                                }
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        else
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} arrival in ${fleet.state.MoveSubwarp.arrivalTime - currentUnixTimestamp} seconds`);

                                        myLog(``);
                                    }
                                    else if (fleet.state.MoveWarp
                                        //end warp
                                    ) {
                                        if (fleet.state.MoveWarp.warpFinish - currentUnixTimestamp < randomWithinRange(-6, 0)) {
                                            {
                                                myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} arrived, stopping `);

                                                const Ix: InstructionReturn[] = [];

                                                Ix.push(Fleet.moveWarpHandler(
                                                    sageProgram,
                                                    fleet.key,
                                                ));

                                                if (Ix.length > 0) {
                                                    try {
                                                        executeGenericTransaction(Ix, walletSigner, connection, x);
                                                    }
                                                    catch (err) {
                                                        myLog(err.message);
                                                    }
                                                }
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        else
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} arrival in ${fleet.state.MoveWarp.warpFinish - currentUnixTimestamp} seconds`);

                                        myLog(``);
                                    }
                                    else
                                        orders[x].refreshData = true;
                                }
                            }
                            else if (x == 0)
                                focusedOrderOnHold = true;

                            break;
                        }
                        case 'Miner': {
                            if (!orders[x].runningPromise) {
                                if (orders[x].auto) {
                                    let fleetGroup = fleets.filter(
                                        (fleet) => byteArrayToString(fleet.data.fleetLabel) === orders[x].fleetLabel
                                    );
                                    let fleet: Fleet;

                                    if (fleetGroup.length == 0)
                                        continue;
                                    else
                                        fleet = fleetGroup[0];

                                    if (orders[x].refreshData || orders[x].food == undefined || orders[x].fuel == undefined || orders[x].ammo == undefined
                                        || orders[x].resourceToMine == undefined
                                        //get actual accounts state
                                    ) {
                                        myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} data refresh`);
                                        const Ix: InstructionReturn[] = [];

                                        awaitRateLimit();
                                        orders[x].foodAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            FOOD,
                                            fleet.data.cargoHold,
                                            true,
                                        );
                                        if (orders[x].foodAccount.instructions != null) {
                                            myLog(`no account food`);
                                            Ix.push(orders[x].foodAccount.instructions);
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].food = await getAccount(
                                                connection,
                                                orders[x].foodAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            FUEL,
                                            fleet.data.fuelTank,
                                            true,
                                        );
                                        if (orders[x].fuelAccount.instructions != null) {
                                            myLog(`no account fuel`);
                                            Ix.push(orders[x].fuelAccount.instructions);
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].fuel = await getAccount(
                                                connection,
                                                orders[x].fuelAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        orders[x].ammoAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            AMMO,
                                            fleet.data.ammoBank,
                                            true,
                                        );
                                        if (orders[x].ammoAccount.instructions != null) {
                                            myLog(`no account ammo`);
                                            Ix.push(orders[x].ammoAccount.instructions);
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].ammo = await getAccount(
                                                connection,
                                                orders[x].ammoAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        var cargoPod = await readFromRPCOrError(
                                            connection,
                                            cargoProgram,
                                            fleet.data.cargoHold,
                                            CargoPod,
                                            'processed',
                                        );

                                        orders[x].cargoSpaceAvailable = (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - getUsedCargoSpace(cargoPod).toNumber();

                                        orders[x].resourceToMine = HYDROGEN;
                                        switch (orders[x].resource) {
                                            case 'Hydrogen':
                                                orders[x].resourceToMine = HYDROGEN;
                                                break;
                                            case 'Biomass':
                                                orders[x].resourceToMine = BIOMASS;
                                                break;
                                            case 'Carbon':
                                                orders[x].resourceToMine = CARBON;
                                                break;
                                            case 'Copper ore':
                                                orders[x].resourceToMine = COPPERORE;
                                                break;
                                            case 'Iron ore':
                                                orders[x].resourceToMine = IRONORE;
                                                break;
                                            case 'Lumanite':
                                                orders[x].resourceToMine = LUMANITE;
                                                break;
                                            case 'Rochinol':
                                                orders[x].resourceToMine = ROCHINOL;
                                                break;
                                            case 'Arco':
                                                orders[x].resourceToMine = ARCO;
                                                break;
                                            case 'Diamond':
                                                orders[x].resourceToMine = DIAMOND;
                                                break;
                                        }

                                        if (Ix.length > 0) {
                                            try {
                                                executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                orders[x].refreshData = true;
                                                if (!blockingActionDone) {
                                                    blockingActionDone = true;
                                                    focusedOrderIdx = x;
                                                }
                                                break;
                                            }
                                            catch (err) {
                                                myLog(err.message);
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        else {
                                            myLog(`no Ix`);
                                            orders[x].refreshData = false;
                                        }
                                    }


                                    if (fleet.state.StarbaseLoadingBay &&
                                        (orders[x].cargoSpaceAvailable == undefined ? true : orders[x].cargoSpaceAvailable < (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - orders[x].minFood)
                                        // unloading goods
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} unloading goods`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            var foodPod: CargoPod;
                                            var foodToken;
                                            var foodInStarbase = 0;

                                            for (const starbaseCargoPod of starbaseCargoPods) {

                                                awaitRateLimit();
                                                const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                    connection,
                                                    starbaseCargoPod.key,
                                                );

                                                if (podTokenAccounts.length > 0) {
                                                    for (let i = 0; i < podTokenAccounts.length; i++) {
                                                        const tokenData = podTokenAccounts[i];
                                                        if (tokenData.mint.toBase58() === FUEL.toBase58()) {
                                                            fuelInStarbase = Number(tokenData.delegatedAmount);
                                                            fuelPod = starbaseCargoPod;
                                                            fuelToken = tokenData;
                                                        }
                                                        if (tokenData.mint.toBase58() === AMMO.toBase58()) {
                                                            ammoInStarbase = Number(tokenData.delegatedAmount);
                                                            ammoPod = starbaseCargoPod;
                                                            ammoToken = tokenData;
                                                        }
                                                        if (tokenData.mint.toBase58() === FOOD.toBase58()) {
                                                            foodInStarbase = Number(tokenData.delegatedAmount);
                                                            foodPod = starbaseCargoPod;
                                                            foodToken = tokenData;
                                                        }
                                                    }
                                                }
                                            }

                                            awaitRateLimit();
                                            const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                connection,
                                                fleet.data.cargoHold,
                                            );

                                            if (podTokenAccounts.length > 0) {
                                                for (let i = 0; i < podTokenAccounts.length; i++) {
                                                    const tokenData = podTokenAccounts[i];

                                                    if (starbaseCargoPods.length == 0) {
                                                        const podSeedBuffer = Keypair.generate().publicKey.toBuffer();
                                                        const podSeeds = Array.from(podSeedBuffer);
                                                        Ix.push(StarbasePlayer.createCargoPod(
                                                            sageProgram,
                                                            cargoProgram,
                                                            starbasePlayer.key,
                                                            walletSigner,
                                                            primaryProfile.key,
                                                            factionKey,
                                                            fleet.state.StarbaseLoadingBay.starbase,
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            gameID,
                                                            game.data.gameState,
                                                            {
                                                                keyIndex: 0,
                                                                podSeeds
                                                            }
                                                        ));
                                                    }

                                                    if (tokenData.mint.toBase58() === FOOD.toBase58()) {
                                                        if (Number(tokenData.delegatedAmount) > orders[x].minFood) {
                                                            var foodAmount = new BN(Number(tokenData.delegatedAmount) - orders[x].minFood);
                                                            if (Number(foodAmount) > 0) {
                                                                Ix.push(Fleet.withdrawCargoFromFleet(
                                                                    sageProgram,
                                                                    cargoProgram,
                                                                    walletSigner,
                                                                    'funder',
                                                                    primaryProfile.key,
                                                                    factionKey,
                                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                                    starbasePlayer.key,
                                                                    fleet.key,
                                                                    fleet.data.cargoHold,
                                                                    foodPod.key,
                                                                    CargoType.findAddress(
                                                                        cargoProgram,
                                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                        FOOD,
                                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                                    )[0],
                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                    orders[x].foodAccount.address,
                                                                    foodToken.address,
                                                                    FOOD,
                                                                    gameID,
                                                                    game.data.gameState,
                                                                    {
                                                                        amount: foodAmount,
                                                                        keyIndex: 0
                                                                    }));
                                                                orders[x].refreshData = true;
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        awaitRateLimit();
                                                        var someAccountTo = await getOrCreateAssociatedTokenAccount(
                                                            connection,
                                                            tokenData.mint,
                                                            starbaseCargoPods[0].key,
                                                            true,
                                                        );
                                                        if (someAccountTo.instructions != null) {
                                                            Ix.push(someAccountTo.instructions);
                                                        }

                                                        if (Number(tokenData.delegatedAmount) > 0) {
                                                            Ix.push(Fleet.withdrawCargoFromFleet(
                                                                sageProgram,
                                                                cargoProgram,
                                                                walletSigner,
                                                                'funder',
                                                                primaryProfile.key,
                                                                factionKey,
                                                                fleet.state.StarbaseLoadingBay.starbase,
                                                                starbasePlayer.key,
                                                                fleet.key,
                                                                fleet.data.cargoHold,
                                                                starbaseCargoPods[0].key,
                                                                CargoType.findAddress(
                                                                    cargoProgram,
                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                    tokenData.mint,
                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                                )[0],
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                tokenData.address,
                                                                someAccountTo.address,
                                                                tokenData.mint,
                                                                gameID,
                                                                game.data.gameState,
                                                                {
                                                                    amount: new BN(tokenData.delegatedAmount),
                                                                    keyIndex: 0
                                                                }));
                                                            orders[x].refreshData = true;
                                                        }
                                                    }
                                                }
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay && (
                                        Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount ||
                                        Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) < orders[x].minAmmo ||
                                        Number(orders[x].food != undefined ? orders[x].food.delegatedAmount : 0) < orders[x].minFood
                                        // loading goods
                                    )) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} loading goods`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            if (starbaseCargoPods.length > 1) {
                                                await cleanStarbaseCargoPods(
                                                    walletSigner,
                                                    connection,
                                                    sageProgram,
                                                    cargoProgram,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    starbasePlayer.key,
                                                    game.data.gameState
                                                );
                                                awaitRateLimit();
                                                starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                    .map(
                                                        (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                    );
                                            }

                                            var fuelPod: CargoPod;
                                            var fuelToken;
                                            var fuelInStarbase = 0;
                                            var ammoPod: CargoPod;
                                            var ammoToken;
                                            var ammoInStarbase = 0;
                                            var foodPod: CargoPod;
                                            var foodToken;
                                            var foodInStarbase = 0;

                                            for (const starbaseCargoPod of starbaseCargoPods) {

                                                awaitRateLimit();
                                                const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                    connection,
                                                    starbaseCargoPod.key,
                                                );

                                                if (podTokenAccounts.length > 0) {
                                                    for (let i = 0; i < podTokenAccounts.length; i++) {
                                                        const tokenData = podTokenAccounts[i];
                                                        if (tokenData.mint.toBase58() === FUEL.toBase58()) {
                                                            fuelInStarbase = Number(tokenData.delegatedAmount);
                                                            fuelPod = starbaseCargoPod;
                                                            fuelToken = tokenData;
                                                        }
                                                        if (tokenData.mint.toBase58() === AMMO.toBase58()) {
                                                            ammoInStarbase = Number(tokenData.delegatedAmount);
                                                            ammoPod = starbaseCargoPod;
                                                            ammoToken = tokenData;
                                                        }
                                                        if (tokenData.mint.toBase58() === FOOD.toBase58()) {
                                                            foodInStarbase = Number(tokenData.delegatedAmount);
                                                            foodPod = starbaseCargoPod;
                                                            foodToken = tokenData;
                                                        }
                                                    }
                                                }
                                            }

                                            if (fuelToken != undefined && Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount &&
                                                fuelInStarbase >= (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0)
                                            ) {
                                                var fuelAmount = new BN((fuelInStarbase >= (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount * 3 - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0)) ?
                                                    (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount * 3 - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) :
                                                    (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0));

                                                Ix.push(Fleet.depositCargoToFleet(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    'funder',
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    starbasePlayer.key,
                                                    fleet.key,
                                                    fuelPod.key,
                                                    fleet.data.fuelTank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FUEL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    fuelToken.address,
                                                    orders[x].fuelAccount.address,
                                                    FUEL,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        amount: fuelAmount,
                                                        keyIndex: 0
                                                    }
                                                ));
                                                orders[x].refreshData = true;
                                            }

                                            if (ammoToken != undefined && Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) < orders[x].minAmmo &&
                                                ammoInStarbase >= orders[x].minAmmo - Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0)
                                            ) {
                                                var ammoAmount = new BN((ammoInStarbase >= orders[x].minAmmo * 3 - Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0)) ?
                                                    orders[x].minAmmo * 3 - Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) :
                                                    orders[x].minAmmo - Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0));

                                                Ix.push(Fleet.depositCargoToFleet(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    'funder',
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    starbasePlayer.key,
                                                    fleet.key,
                                                    ammoPod.key,
                                                    fleet.data.ammoBank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        AMMO,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    ammoToken.address,
                                                    orders[x].ammoAccount.address,
                                                    AMMO,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        amount: ammoAmount,
                                                        keyIndex: 0
                                                    }));
                                                orders[x].refreshData = true;
                                            }

                                            if (foodToken != undefined && Number(orders[x].food != undefined ? orders[x].food.delegatedAmount : 0) < orders[x].minFood &&
                                                foodInStarbase >= orders[x].minFood - Number(orders[x].food != undefined ? orders[x].food.delegatedAmount : 0)
                                            ) {
                                                var foodAmount = new BN(orders[x].minFood - Number(orders[x].food != undefined ? orders[x].food.delegatedAmount : 0));

                                                Ix.push(Fleet.depositCargoToFleet(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    'funder',
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    starbasePlayer.key,
                                                    fleet.key,
                                                    foodPod.key,
                                                    fleet.data.cargoHold,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FOOD,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    foodToken.address,
                                                    orders[x].foodAccount.address,
                                                    FOOD,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        amount: foodAmount,
                                                        keyIndex: 0
                                                    }));
                                                orders[x].refreshData = true;
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay && (
                                        Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount &&
                                        Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) >= orders[x].minAmmo &&
                                        Number(orders[x].food != undefined ? orders[x].food.delegatedAmount : 0) >= orders[x].minFood &&
                                        (orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - orders[x].minFood)
                                        // undocking
                                    )) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} commence undock`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            Ix.push(Fleet.loadingBayToIdle(
                                                sageProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                fleet.key,
                                                fleet.state.StarbaseLoadingBay.starbase,
                                                starbasePlayer.key,
                                                gameID,
                                                game.data.gameState,
                                                0
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.Idle &&
                                        orders[x].cargoSpaceAvailable == undefined
                                        // undocked check cargo space
                                    ) {
                                        myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} undocked unknown cargo state`);

                                        const Ix: InstructionReturn[] = [];
                                        awaitRateLimit();
                                        orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            FUEL,
                                            fleet.data.fuelTank,
                                            true,
                                        );
                                        if (orders[x].fuelAccount.instructions != null) {
                                            myLog(`no account fuel`);
                                            Ix.push(orders[x].fuelAccount.instructions);
                                            orders[x].refreshData = true;
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].fuel = await getAccount(
                                                connection,
                                                orders[x].fuelAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        orders[x].ammoAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            AMMO,
                                            fleet.data.ammoBank,
                                            true,
                                        );
                                        if (orders[x].ammoAccount.instructions != null) {
                                            myLog(`no account ammo`);
                                            Ix.push(orders[x].ammoAccount.instructions);
                                            orders[x].refreshData = true;
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].ammo = await getAccount(
                                                connection,
                                                orders[x].ammoAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        orders[x].foodAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            FOOD,
                                            fleet.data.cargoHold,
                                            true,
                                        );
                                        if (orders[x].foodAccount.instructions != null) {
                                            myLog(`no account food`);
                                            Ix.push(orders[x].foodAccount.instructions);
                                            orders[x].refreshData = true;
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].food = await getAccount(
                                                connection,
                                                orders[x].foodAccount.address,
                                                'processed',
                                            );
                                        }
                                        if (Ix.length > 0) {
                                            try {
                                                executeGenericTransaction(Ix, walletSigner, connection, x);
                                            }
                                            catch (err) {
                                                myLog(err.message);
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        else
                                            myLog(`no Ix`);

                                        orders[x].cargoSpaceAvailable = (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - getUsedCargoSpace(cargoPod).toNumber();
                                    }
                                    else if (fleet.state.Idle &&
                                        (orders[x].cargoSpaceAvailable < (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - orders[x].minFood)
                                        // start docking
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} start docking`);
                                            const Ix: InstructionReturn[] = [];
                                            var starbase = Starbase.findAddress(sageProgram, gameID, fleet.state.Idle.sector as [BN, BN])[0];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            Ix.push(Fleet.idleToLoadingBay(
                                                sageProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                fleet.key,
                                                starbase,
                                                starbasePlayer.key,
                                                gameID,
                                                game.data.gameState,
                                                0
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.Idle &&
                                        (
                                            Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount &&
                                            Number(orders[x].ammo != undefined ? orders[x].ammo.delegatedAmount : 0) >= orders[x].minAmmo &&
                                            Number(orders[x].food != undefined ? orders[x].food.delegatedAmount : 0) >= orders[x].minFood &&
                                            (orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - orders[x].minFood)
                                            // start mining
                                        )) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} starting mining at ${fleet.state.Idle.sector[0]}, ${fleet.state.Idle.sector[1]}`);

                                            const Ix: InstructionReturn[] = [];

                                            var starbase = Starbase.findAddress(sageProgram, gameID, fleet.state.Idle.sector as [BN, BN])[0];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            let planet = planets.filter(
                                                (some) => (some.data.sector[0].toNumber() == fleet.state.Idle.sector[0].toNumber()) && (some.data.sector[1].toNumber() == fleet.state.Idle.sector[1].toNumber())
                                            );

                                            if (planet.length == 0)
                                                myLog(`no planet found`);

                                            myLog(`Planet: ${planet[0].prettyName}`);

                                            const mineItemKey = MineItem.findAddress(
                                                sageProgram,
                                                gameID,
                                                orders[x].resourceToMine,
                                            )[0];

                                            const resourceKey = Resource.findAddress(
                                                sageProgram,
                                                mineItemKey,
                                                planet[0].key,
                                            )[0];

                                            if (orders[x].fuelAccount.instructions != null) {
                                                myLog(`no account fuel`);
                                                Ix.push(orders[x].fuelAccount.instructions);
                                                orders[x].refreshData = true;
                                            }
                                            else {
                                                awaitRateLimit();
                                                orders[x].fuel = await getAccount(
                                                    connection,
                                                    orders[x].fuelAccount.address,
                                                    'processed',
                                                );
                                            }

                                            if (Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount)
                                                Ix.push(Fleet.startMiningAsteroid(
                                                    sageProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    starbase,
                                                    starbasePlayer.key,
                                                    mineItemKey,
                                                    resourceKey,
                                                    planet[0].key,
                                                    game.data.gameState,
                                                    gameID,
                                                    {
                                                        keyIndex: 0,
                                                    },
                                                ));
                                            else {
                                                myLog(`Uf, nearly started mining without fuel`);
                                                orders[x].refreshData = true;
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                //focusedOrderIdx = x;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.MineAsteroid
                                        // check mining status
                                    ) {
                                        const mineItemKey = MineItem.findAddress(
                                            sageProgram,
                                            gameID,
                                            orders[x].resourceToMine,
                                        )[0];

                                        const resourceKey = Resource.findAddress(
                                            sageProgram,
                                            mineItemKey,
                                            fleet.state.MineAsteroid.asteroid,
                                        )[0];

                                        if (orders[x].maxMiningDuration == undefined) {
                                            awaitRateLimit();
                                            const mineItemAcc = await readFromRPCOrError(
                                                connection,
                                                sageProgram,
                                                mineItemKey,
                                                MineItem,
                                                'processed',
                                            );

                                            awaitRateLimit();
                                            const resourceAcc = await readFromRPCOrError(
                                                connection,
                                                sageProgram,
                                                resourceKey,
                                                Resource,
                                                'processed',
                                            );

                                            var cargo = CargoType.findAddress(
                                                cargoProgram,
                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                orders[x].resourceToMine,
                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                            )[0];

                                            awaitRateLimit();
                                            const cargoItemAcc = await readFromRPCOrError(
                                                connection,
                                                cargoProgram,
                                                cargo,
                                                CargoType,
                                                'processed',
                                            );

                                            const maxFoodDuration = Fleet.calculateAsteroidMiningFoodDuration(
                                                <ShipStats>fleet.data.stats,
                                                orders[x].minFood,
                                            );
                                            const maxAmmoDuration = Fleet.calculateAsteroidMiningAmmoDuration(
                                                <ShipStats>fleet.data.stats,
                                                orders[x].minAmmo,
                                            );
                                            const resourceMax = getTokenAmountToTeachTargetStat(
                                                cargoItemAcc, new BN(orders[x].cargoSpaceAvailable));

                                            const maxResourceDuration = Fleet.calculateAsteroidMiningResourceExtractionDuration(
                                                <ShipStats>fleet.data.stats,
                                                mineItemAcc.data,
                                                resourceAcc.data,
                                                resourceMax,
                                            );

                                            if (maxAmmoDuration > 0)
                                                orders[x].maxMiningDuration = Math.min(maxFoodDuration, maxAmmoDuration, maxResourceDuration);
                                            else
                                                orders[x].maxMiningDuration = Math.min(maxFoodDuration, maxResourceDuration);

                                            myLog(`Calculated mining duration ${round(orders[x].maxMiningDuration, 1)}`);
                                        }

                                        if ((fleet.state.MineAsteroid.start.toNumber() + orders[x].maxMiningDuration - currentUnixTimestamp) < randomWithinRange(-60, -1)
                                            // stop mining
                                        ) {
                                            if (!blockingActionDone) {
                                                myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} stop mining`);

                                                const Ix: InstructionReturn[] = [];

                                                awaitRateLimit();
                                                orders[x].resourceAccount = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    orders[x].resourceToMine,
                                                    fleet.data.cargoHold,
                                                    true,
                                                );
                                                if (orders[x].resourceAccount.instructions != null) {
                                                    myLog(`no account for resource ${orders[x].resourceToMine}`);
                                                    Ix.push(orders[x].resourceAccount.instructions);
                                                }

                                                let asteroid = planets.filter(
                                                    (some) => some.key.toBase58() == fleet.state.MineAsteroid.asteroid.toBase58()
                                                );
                                                var starbase = Starbase.findAddress(sageProgram, gameID, asteroid[0].data.sector as [BN, BN])[0];

                                                awaitRateLimit();
                                                const resourceTokenFrom = await getOrCreateAssociatedTokenAccount(
                                                    connection,
                                                    orders[x].resourceToMine,
                                                    mineItemKey,
                                                    true,
                                                );

                                                Ix.push(Fleet.asteroidMiningHandler(
                                                    sageProgram,
                                                    cargoProgram,
                                                    factionKey,
                                                    fleet.key,
                                                    starbase,
                                                    mineItemKey,
                                                    fleet.state.MineAsteroid.resource,
                                                    fleet.state.MineAsteroid.asteroid,
                                                    fleet.data.cargoHold,
                                                    fleet.data.ammoBank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FOOD,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        AMMO,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        orders[x].resourceToMine,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    game.data.gameState,
                                                    gameID,
                                                    orders[x].foodAccount.address,
                                                    orders[x].ammoAccount.address,
                                                    resourceTokenFrom.address,
                                                    orders[x].resourceAccount.address,
                                                    FOOD,
                                                    AMMO
                                                ));

                                                if (orders[x].fuel.delegatedAmount >= (<ShipStats>fleet.data.stats).movementStats.planetExitFuelAmount) {
                                                    Ix.push(Fleet.stopMiningAsteroid(
                                                        sageProgram,
                                                        cargoProgram,
                                                        walletSigner,
                                                        primaryProfile.key,
                                                        factionKey,
                                                        fleet.key,
                                                        fleet.state.MineAsteroid.resource,
                                                        fleet.state.MineAsteroid.asteroid,
                                                        fleet.data.fuelTank,
                                                        CargoType.findAddress(
                                                            cargoProgram,
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            FUEL,
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                        )[0],
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        game.data.gameState,
                                                        gameID,
                                                        orders[x].fuel.address,
                                                        FUEL,
                                                        {
                                                            keyIndex: 0,
                                                        },
                                                    ));
                                                }
                                                else {
                                                    awaitRateLimit();
                                                    const atlasTokenFrom = await getOrCreateAssociatedTokenAccount(
                                                        connection,
                                                        ATLAS,
                                                        walletSigner.publicKey(),
                                                        true,
                                                    );

                                                    awaitRateLimit();
                                                    const atlas = await getAccount(
                                                        connection,
                                                        atlasTokenFrom.address,
                                                        'processed',
                                                    );
                                                    if (Number(atlas.amount) / Math.pow(10, 8) < 150)
                                                        myLog(`Trying to respawn fleet, but will probably fail as not enough ATLAS ${atlas.amount}`);

                                                    Ix.push(Fleet.mineAsteroidToRespawn(
                                                        sageProgram,
                                                        walletSigner,
                                                        primaryProfile.key,
                                                        factionKey,
                                                        fleet.key,
                                                        fleet.state.MineAsteroid.resource,
                                                        fleet.state.MineAsteroid.asteroid,
                                                        fleet.data.fuelTank,
                                                        game.data.gameState,
                                                        gameID,
                                                        orders[x].fuel.address,
                                                        atlasTokenFrom.address,
                                                        game.data.vaults.atlas,
                                                        {
                                                            keyIndex: 0,
                                                        },
                                                    ));
                                                }

                                                if (Ix.length > 0) {
                                                    try {
                                                        executeGenericTransaction(Ix, walletSigner, connection, x);
                                                        orders[x].maxMiningDuration = undefined;
                                                    }
                                                    catch (err) {
                                                        myLog(err.message);
                                                        orders[x].refreshData = true;
                                                    }
                                                    orders[x].refreshData = true;
                                                    blockingActionDone = true;
                                                    focusedOrderIdx = x;
                                                }
                                                else
                                                    myLog(`no Ix`);

                                                orders[x].cargoSpaceAvailable = 0;

                                                myLog(``);
                                            }
                                        }
                                        else {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} mining for another ${round(fleet.state.MineAsteroid.start.toNumber() + orders[x].maxMiningDuration - currentUnixTimestamp, 1)} seconds, mine duration ${round(orders[x].maxMiningDuration, 1)}`);
                                        }
                                    }
                                    else
                                        orders[x].refreshData = true;
                                }
                            }
                            else if (x == 0)
                                focusedOrderOnHold = true;

                            break;
                        }
                        case 'SDU': {
                            if (!orders[x].runningPromise) {
                                if (orders[x].auto) {
                                    let fleetGroup = fleets.filter(
                                        (fleet) => byteArrayToString(fleet.data.fleetLabel) === orders[x].fleetLabel
                                    );
                                    let fleet: Fleet;

                                    if (fleetGroup.length == 0)
                                        continue;
                                    else
                                        fleet = fleetGroup[0];

                                    if ((fleet.state.Idle || fleet.state.StarbaseLoadingBay) && (orders[x].refreshData ||
                                        orders[x].fuelAccount == undefined || orders[x].fuel == undefined ||
                                        orders[x].sduTokenTo == undefined ||
                                        orders[x].toolAccount == undefined || orders[x].tool == undefined || orders[x].toolAmount == undefined ||
                                        orders[x].cargoSpaceAvailable == undefined || orders[x].minTool == undefined)
                                        //get actual accounts state
                                    ) {
                                        myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} data refresh ${orders[x].refreshData}`);
                                        const Ix: InstructionReturn[] = [];

                                        awaitRateLimit();
                                        orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            FUEL,
                                            fleet.data.fuelTank,
                                            true,
                                        );
                                        if (orders[x].fuelAccount.instructions != null) {
                                            myLog(`no account fuel`);
                                            Ix.push(orders[x].fuelAccount.instructions);
                                        }
                                        else {
                                            awaitRateLimit();
                                            orders[x].fuel = await getAccount(
                                                connection,
                                                orders[x].fuelAccount.address,
                                                'processed',
                                            );
                                        }

                                        awaitRateLimit();
                                        orders[x].sduTokenTo = await getOrCreateAssociatedTokenAccount(
                                            connection,
                                            SDU,
                                            fleet.data.cargoHold,
                                            true,
                                        );
                                        if (orders[x].sduTokenTo.instructions != null) {
                                            myLog(`no SDU token acc`);
                                            Ix.push(orders[x].sduTokenTo.instructions);
                                        }

                                        awaitRateLimit();
                                        orders[x].toolAccount =
                                            await getOrCreateAssociatedTokenAccount(
                                                connection,
                                                TOOL,
                                                fleet.data.cargoHold,
                                                true,
                                            );

                                        if (orders[x].toolAccount.instructions != null) {
                                            myLog(`no TOOL token acc`);
                                            Ix.push(orders[x].toolAccount.instructions);
                                        }

                                        awaitRateLimit();
                                        if (orders[x].toolAccount.instructions == null) {
                                            orders[x].tool = await getAccount(
                                                connection,
                                                orders[x].toolAccount.address,
                                                'processed',
                                            );
                                        }
                                        orders[x].toolAmount = Number(orders[x].tool != undefined ? orders[x].tool.delegatedAmount : 0);

                                        awaitRateLimit();
                                        var cargoPod = await readFromRPCOrError(
                                            connection,
                                            cargoProgram,
                                            fleet.data.cargoHold,
                                            CargoPod,
                                            'processed',
                                        );

                                        orders[x].cargoSpaceAvailable = (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - getUsedCargoSpace(cargoPod).toNumber();

                                        orders[x].minTool = (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - ((<ShipStats>fleet.data.stats).cargoStats.cargoCapacity % (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount);

                                        if (orders[x].newScanSector == undefined
                                        ) {
                                            if (fleet.state.Idle)
                                                orders[x].newScanSector = [Number(fleet.state.Idle.sector[0]), Number(fleet.state.Idle.sector[1])];
                                            else if (fleet.state.MoveSubwarp)
                                                orders[x].newScanSector = [Number(fleet.state.MoveSubwarp.currentSector[0]), Number(fleet.state.MoveSubwarp.currentSector[1])];
                                            else if (fleet.state.MoveWarp)
                                                orders[x].newScanSector = [Number(fleet.state.MoveWarp.toSector[0]), Number(fleet.state.MoveWarp.toSector[1])];
                                            else if (fleet.state.Respawn)
                                                orders[x].newScanSector = [Number(fleet.state.Respawn.sector[0]), Number(fleet.state.Respawn.sector[1])];
                                            else if (fleet.state.StarbaseLoadingBay) {
                                                awaitRateLimit();
                                                var starbaseAccount = await readFromRPCOrError(
                                                    connection,
                                                    sageProgram,
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    Starbase,
                                                    'processed',
                                                );
                                                orders[x].newScanSector = [Number(starbaseAccount.data.sector[0]), Number(starbaseAccount.data.sector[1])];
                                            }
                                            else if (fleet.state.MineAsteroid) {
                                                awaitRateLimit();
                                                var asteroidAccount = await readFromRPCOrError(
                                                    connection,
                                                    sageProgram,
                                                    fleet.state.MineAsteroid.asteroid,
                                                    Planet,
                                                    'processed',
                                                );
                                                orders[x].newScanSector = [Number(asteroidAccount.data.sector[0]), Number(asteroidAccount.data.sector[1])];
                                            }
                                        }

                                        if (Ix.length > 0) {
                                            try {
                                                executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                orders[x].refreshData = true;
                                                if (!blockingActionDone) {
                                                    blockingActionDone = true;
                                                    focusedOrderIdx = x;
                                                }
                                                break;
                                            }
                                            catch (err) {
                                                myLog(err.message);
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        else {
                                            orders[x].refreshData = false;
                                        }

                                    }

                                    if (fleet.state.Idle && !(fleet.state.Idle.sector[0] == orders[x].baseSector[0] && fleet.state.Idle.sector[1] == orders[x].baseSector[1]) &&
                                        (fleet.state.Idle.sector[0] == orders[x].newScanSector[0] && fleet.state.Idle.sector[1] == orders[x].newScanSector[1]) &&
                                        !orders[x].forceScan && !blockingActionDone
                                    ) {
                                        var sectorIndex = SurveyDataUnitTracker.findSectorIndex(
                                            [fleet.state.Idle.sector[0], fleet.state.Idle.sector[1]],
                                        );

                                        myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} actual calculated probability: ${round(sduMap[sectorIndex].probability * 100, 2)}%`);
                                        var timeToMoveSq = (<ShipStats>fleet.data.stats).movementStats.subwarpSpeed / 1000000;
                                        var newMyProb = sduMap[sectorIndex].probability + timeToMoveSq * (sduMapLastActualisation + timeToMoveSq - trackerBefore.sectors[sectorIndex] > 120 ? 0.000033 : sduMap[sectorIndex].maxProb / 120);
                                        if (newMyProb > sduMap[sectorIndex].maxProb)
                                            newMyProb = sduMap[sectorIndex].maxProb;

                                        if ((newMyProb < orders[x].minProbabilityToStay && currentUnixTimestamp + timeToMoveSq - trackerBefore.sectors[sectorIndex] > 120) || sduMap[sectorIndex].maxProb < orders[x].minProbabilityToStay) {
                                            awaitRateLimit();
                                            orders[x].fuel = await getAccount(
                                                connection,
                                                orders[x].fuelAccount.address,
                                                'processed',
                                            );

                                            var foundEmpty = false;
                                            var coordArray = [];

                                            for (var xi = (orders[x].newScanSector[0] - 1 < -49 ? -49 : orders[x].newScanSector[0] - 1); xi <= (orders[x].newScanSector[0] + 1 > 49 ? 49 : orders[x].newScanSector[0] + 1); xi++) {
                                                for (var yi = (orders[x].newScanSector[1] - 1 < -49 ? -49 : orders[x].newScanSector[1] - 1); yi <= (orders[x].newScanSector[1] + 1 > 49 ? 49 : orders[x].newScanSector[1] + 1); yi++) {
                                                    if (!(xi == fleet.state.Idle.sector[0] && yi == fleet.state.Idle.sector[1]) && !(xi == orders[x].baseSector[0] && yi == orders[x].baseSector[1]))
                                                        coordArray.push([xi, yi]);
                                                }
                                            }
                                            coordArray.sort((a, b) => calculateDistance([new BN(a[0]), new BN(a[1])], [new BN(0), new BN(0)]) - calculateDistance([new BN(b[0]), new BN(b[1])], [new BN(0), new BN(0)]));

                                            for (var j = 0; j < coordArray.length; j++) {
                                                var newSectorIndex = SurveyDataUnitTracker.findSectorIndex(
                                                    [new BN(coordArray[j][0]), new BN(coordArray[j][1])],
                                                );
                                                var timeToGetThere = Fleet.calculateSubwarpTimeWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], [new BN(coordArray[j][0]), new BN(coordArray[j][1])]);
                                                var newOtherProb = sduMap[newSectorIndex].probability + timeToGetThere * (sduMapLastActualisation + timeToGetThere - trackerBefore.sectors[newSectorIndex] > 120 ? 0.000033 : sduMap[newSectorIndex].maxProb / 120);
                                                if (newOtherProb > sduMap[newSectorIndex].maxProb)
                                                    newOtherProb = sduMap[newSectorIndex].maxProb;
                                                var newMyProb = sduMap[sectorIndex].probability + timeToGetThere * (sduMapLastActualisation + timeToGetThere - trackerBefore.sectors[sectorIndex] > 120 ? 0.000033 : sduMap[sectorIndex].maxProb / 120);
                                                if (newMyProb > sduMap[sectorIndex].maxProb)
                                                    newMyProb = sduMap[sectorIndex].maxProb;

                                                var nobodyElse = true;
                                                for (var k = 0; k < orders.length; k++) {
                                                    if (orders[k].role == "SDU" && (coordArray[j][0] == (orders[k].newScanSector != undefined ? orders[k].newScanSector[0] : -50) && coordArray[j][1] == (orders[k].newScanSector != undefined ? orders[k].newScanSector[1] : -50) ||
                                                        (newOtherProb < newMyProb || newOtherProb < orders[x].minProbabilityToStay || sduMap[newSectorIndex].maxProb < orders[x].minProbabilityToStay))
                                                    )
                                                        nobodyElse = false;
                                                }

                                                if (nobodyElse) {
                                                    if (Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], [new BN(coordArray[j][0]), new BN(coordArray[j][1])]) +
                                                        Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, [new BN(coordArray[j][0]), new BN(coordArray[j][1])], [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])])) * 1.02
                                                    ) {
                                                        orders[x].newScanSector[0] = coordArray[j][0];
                                                        orders[x].newScanSector[1] = coordArray[j][1];
                                                        foundEmpty = true;
                                                        myLog(`New calculated probability in other sector ${orders[x].newScanSector[0]},${orders[x].newScanSector[1]}: ${round(newOtherProb * 100, 2)}%`);
                                                        break;
                                                    }
                                                }
                                            }

                                            if (!foundEmpty) {
                                                //try to scan along going to base
                                                var coordArray = [];
                                                var distToDestination = Math.sqrt(Math.pow(orders[x].baseSector[0] - fleet.state.Idle.sector[0], 2) + Math.pow(orders[x].baseSector[1] - fleet.state.Idle.sector[1], 2));
                                                for (var i = 1; i <= Math.ceil(distToDestination); i++) {
                                                    var destX = Number(fleet.state.Idle.sector[0]) + (orders[x].baseSector[0] - Number(fleet.state.Idle.sector[0])) / i;
                                                    var destY = Number(fleet.state.Idle.sector[1]) + (orders[x].baseSector[1] - Number(fleet.state.Idle.sector[1])) / i;
                                                    coordArray.push([Math.ceil(destX), Math.ceil(destY)]);
                                                    coordArray.push([Math.ceil(destX), Math.floor(destY)]);
                                                    coordArray.push([Math.floor(destX), Math.ceil(destY)]);
                                                    coordArray.push([Math.floor(destX), Math.floor(destY)]);
                                                }
                                                var filteredCoordinates = coordArray.filter((item,
                                                    index) => coordArray.indexOf(item) === index);

                                                filteredCoordinates
                                                    .sort((a, b) => calculateDistance([new BN(b[0]), new BN(b[1])], [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])]) - calculateDistance([new BN(a[0]), new BN(a[1])], [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])]));

                                                for (var j = 0; j < filteredCoordinates.length; j++) {
                                                    var newSectorIndex = SurveyDataUnitTracker.findSectorIndex(
                                                        [new BN(filteredCoordinates[j][0]), new BN(filteredCoordinates[j][1])],
                                                    );
                                                    var timeToGetThere = Fleet.calculateSubwarpTimeWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], [new BN(filteredCoordinates[j][0]), new BN(filteredCoordinates[j][1])]);
                                                    var newOtherProb = sduMap[newSectorIndex].probability + timeToGetThere * (sduMapLastActualisation + timeToGetThere - trackerBefore.sectors[newSectorIndex] > 120 ? 0.000033 : sduMap[newSectorIndex].maxProb / 120);
                                                    if (newOtherProb > sduMap[newSectorIndex].maxProb)
                                                        newOtherProb = sduMap[newSectorIndex].maxProb;
                                                    var newMyProb = sduMap[sectorIndex].probability + timeToGetThere * (sduMapLastActualisation + timeToGetThere - trackerBefore.sectors[sectorIndex] > 120 ? 0.000033 : sduMap[sectorIndex].maxProb / 120);
                                                    if (newMyProb > sduMap[sectorIndex].maxProb)
                                                        newMyProb = sduMap[sectorIndex].maxProb;

                                                    var nobodyElse = true;
                                                    for (var k = 0; k < orders.length; k++) {
                                                        if (orders[k].role == "SDU" && (filteredCoordinates[j][0] == (orders[k].newScanSector != undefined ? orders[k].newScanSector[0] : -50) && filteredCoordinates[j][1] == (orders[k].newScanSector != undefined ? orders[k].newScanSector[1] : -50) ||
                                                            (newOtherProb < newMyProb || newOtherProb < orders[x].minProbabilityToStay || sduMap[newSectorIndex].maxProb < orders[x].minProbabilityToStay))
                                                        )
                                                            nobodyElse = false;
                                                    }

                                                    if (nobodyElse) {
                                                        if (Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], [new BN(filteredCoordinates[j][0]), new BN(filteredCoordinates[j][1])]) +
                                                            Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, [new BN(filteredCoordinates[j][0]), new BN(filteredCoordinates[j][1])], [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])])) * 1.02
                                                        ) {
                                                            orders[x].newScanSector[0] = filteredCoordinates[j][0];
                                                            orders[x].newScanSector[1] = filteredCoordinates[j][1];
                                                            foundEmpty = true;
                                                            myLog(`New calculated probability in other sector ${orders[x].newScanSector[0]},${orders[x].newScanSector[1]}: ${round(newOtherProb * 100, 2)}%`);
                                                            break;
                                                        }
                                                    }
                                                }

                                                if (!foundEmpty) {
                                                    myLog(`No way to go... Returning home`);
                                                    orders[x].newScanSector[0] = orders[x].baseSector[0];
                                                    orders[x].newScanSector[1] = orders[x].baseSector[1];
                                                }
                                            }
                                        }
                                    }

                                    if (fleet.state.Idle && fleet.state.Idle.sector[0] == orders[x].baseSector[0] && fleet.state.Idle.sector[1] == orders[x].baseSector[1] &&
                                        (orders[x].toolAmount < orders[x].minTool * 0.5 || Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity * 0.9)
                                        //docking
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} start docking`);
                                            const Ix: InstructionReturn[] = [];
                                            var starbase = Starbase.findAddress(sageProgram, gameID, fleet.state.Idle.sector as [BN, BN])[0];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            Ix.push(Fleet.idleToLoadingBay(
                                                sageProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                fleet.key,
                                                starbase,
                                                starbasePlayer.key,
                                                gameID,
                                                game.data.gameState,
                                                0
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                                orders[x].forceScan = false;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay &&
                                        orders[x].toolAmount < orders[x].minTool &&
                                        orders[x].cargoSpaceAvailable < (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - orders[x].toolAmount
                                        // unload goods
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} unloading goods`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            var toolPod: CargoPod;
                                            var toolToken;
                                            var toolInStarbase = 0;

                                            for (const starbaseCargoPod of starbaseCargoPods) {

                                                awaitRateLimit();
                                                const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                    connection,
                                                    starbaseCargoPod.key,
                                                );

                                                if (podTokenAccounts.length > 0) {
                                                    for (let i = 0; i < podTokenAccounts.length; i++) {
                                                        const tokenData = podTokenAccounts[i];
                                                        if (tokenData.mint.toBase58() === TOOL.toBase58()) {
                                                            toolInStarbase = Number(tokenData.delegatedAmount);
                                                            toolPod = starbaseCargoPod;
                                                            toolToken = tokenData;
                                                        }
                                                    }
                                                }
                                            }

                                            awaitRateLimit();
                                            const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                connection,
                                                fleet.data.cargoHold,
                                            );

                                            if (podTokenAccounts.length > 0) {
                                                for (let i = 0; i < podTokenAccounts.length; i++) {
                                                    const tokenData = podTokenAccounts[i];

                                                    if (starbaseCargoPods.length == 0) {
                                                        const podSeedBuffer = Keypair.generate().publicKey.toBuffer();
                                                        const podSeeds = Array.from(podSeedBuffer);
                                                        Ix.push(StarbasePlayer.createCargoPod(
                                                            sageProgram,
                                                            cargoProgram,
                                                            starbasePlayer.key,
                                                            walletSigner,
                                                            primaryProfile.key,
                                                            factionKey,
                                                            fleet.state.StarbaseLoadingBay.starbase,
                                                            cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                            gameID,
                                                            game.data.gameState,
                                                            {
                                                                keyIndex: 0,
                                                                podSeeds
                                                            }
                                                        ));
                                                    }

                                                    if (tokenData.mint.toBase58() != TOOL.toBase58()) {
                                                        awaitRateLimit();
                                                        var someAccountTo = await getOrCreateAssociatedTokenAccount(
                                                            connection,
                                                            tokenData.mint,
                                                            starbaseCargoPods[0].key,
                                                            true,
                                                        );
                                                        if (someAccountTo.instructions != null) {
                                                            Ix.push(someAccountTo.instructions);
                                                        }

                                                        if (Number(tokenData.delegatedAmount) > 0) {
                                                            Ix.push(Fleet.withdrawCargoFromFleet(
                                                                sageProgram,
                                                                cargoProgram,
                                                                walletSigner,
                                                                'funder',
                                                                primaryProfile.key,
                                                                factionKey,
                                                                fleet.state.StarbaseLoadingBay.starbase,
                                                                starbasePlayer.key,
                                                                fleet.key,
                                                                fleet.data.cargoHold,
                                                                starbaseCargoPods[0].key,
                                                                CargoType.findAddress(
                                                                    cargoProgram,
                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                    tokenData.mint,
                                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                                )[0],
                                                                cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                                tokenData.address,
                                                                someAccountTo.address,
                                                                tokenData.mint,
                                                                gameID,
                                                                game.data.gameState,
                                                                {
                                                                    amount: new BN(tokenData.delegatedAmount),
                                                                    keyIndex: 0
                                                                }));
                                                            orders[x].refreshData = true;
                                                        }
                                                    }
                                                }
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                                orders[x].forceScan = false;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay && ((
                                        orders[x].toolAmount < orders[x].minTool &&
                                        orders[x].cargoSpaceAvailable >= (<ShipStats>fleet.data.stats).cargoStats.cargoCapacity - orders[x].toolAmount) ||
                                        (Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity * 0.9))
                                        //load supplies
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} loading supplies`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            awaitRateLimit();
                                            var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                .map(
                                                    (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                );

                                            if (starbaseCargoPods.length > 1) {
                                                await cleanStarbaseCargoPods(
                                                    walletSigner,
                                                    connection,
                                                    sageProgram,
                                                    cargoProgram,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    starbasePlayer.key,
                                                    game.data.gameState
                                                );
                                                awaitRateLimit();
                                                starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer.key))
                                                    .map(
                                                        (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
                                                    );
                                            }

                                            var fuelPod: CargoPod;
                                            var fuelToken;
                                            var fuelInStarbase = 0;
                                            var toolPod: CargoPod;
                                            var toolToken;
                                            var toolInStarbase = 0;

                                            for (const starbaseCargoPod of starbaseCargoPods) {

                                                awaitRateLimit();
                                                const podTokenAccounts = await betterGetTokenAccountsByOwner(
                                                    connection,
                                                    starbaseCargoPod.key,
                                                );

                                                if (podTokenAccounts.length > 0) {
                                                    for (let i = 0; i < podTokenAccounts.length; i++) {
                                                        const tokenData = podTokenAccounts[i];
                                                        if (tokenData.mint.toBase58() === FUEL.toBase58()) {
                                                            fuelInStarbase = Number(tokenData.delegatedAmount);
                                                            fuelPod = starbaseCargoPod;
                                                            fuelToken = tokenData;
                                                        }
                                                        if (tokenData.mint.toBase58() === TOOL.toBase58()) {
                                                            toolInStarbase = Number(tokenData.delegatedAmount);
                                                            toolPod = starbaseCargoPod;
                                                            toolToken = tokenData;
                                                        }
                                                    }
                                                }
                                            }

                                            if (fuelToken != undefined && Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) < (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity &&
                                                fuelInStarbase >= (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0)
                                            ) {
                                                var scanFuelAmount = (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity - Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0);

                                                Ix.push(Fleet.depositCargoToFleet(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    'funder',
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    starbasePlayer.key,
                                                    fleet.key,
                                                    fuelPod.key,
                                                    fleet.data.fuelTank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FUEL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    fuelToken.address,
                                                    orders[x].fuelAccount.address,
                                                    FUEL,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        amount: new BN(scanFuelAmount),
                                                        keyIndex: 0
                                                    }
                                                ));
                                                orders[x].refreshData = true;
                                            }

                                            if (toolToken != undefined && orders[x].toolAmount < orders[x].minTool &&
                                                toolInStarbase >= orders[x].minTool - orders[x].toolAmount
                                            ) {
                                                var scanToolAmount = orders[x].minTool - orders[x].toolAmount;
                                                Ix.push(Fleet.depositCargoToFleet(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    'funder',
                                                    fleet.state.StarbaseLoadingBay.starbase,
                                                    starbasePlayer.key,
                                                    fleet.key,
                                                    toolPod.key,
                                                    fleet.data.cargoHold,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        TOOL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    toolToken.address,
                                                    orders[x].toolAccount.address,
                                                    TOOL,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        amount: new BN(scanToolAmount),
                                                        keyIndex: 0
                                                    }));
                                                orders[x].refreshData = true;
                                            }

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                                orders[x].forceScan = false;
                                            }
                                            else {
                                                myLog(`no Ix`);
                                                orders[x].refreshData = true;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.StarbaseLoadingBay && (
                                        orders[x].toolAmount >= orders[x].minTool && Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity * 0.9
                                        //undocking
                                    )) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} commence undock`);
                                            const Ix: InstructionReturn[] = [];

                                            var starbasePlayerGroup = starbasePlayers.filter(
                                                (starbasePlayer) => starbasePlayer.data.starbase.toBase58() === fleet.state.StarbaseLoadingBay.starbase.toBase58()
                                            );

                                            var starbasePlayer = starbasePlayerGroup[0];

                                            Ix.push(Fleet.loadingBayToIdle(
                                                sageProgram,
                                                walletSigner,
                                                primaryProfile.key,
                                                factionKey,
                                                fleet.key,
                                                fleet.state.StarbaseLoadingBay.starbase,
                                                starbasePlayer.key,
                                                gameID,
                                                game.data.gameState,
                                                0
                                            ));

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransactionWithFocus(Ix, walletSigner, connection, x);
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                    orders[x].refreshData = true;
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                                orders[x].forceScan = false;
                                            }
                                            else
                                                myLog(`no Ix`);

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.Idle && (fleet.state.Idle.sector[0] == orders[x].baseSector[0] && fleet.state.Idle.sector[1] == orders[x].baseSector[1]) &&
                                        orders[x].toolAmount >= orders[x].minTool * 0.5 && Number(orders[x].fuel != undefined ? orders[x].fuel.delegatedAmount : 0) >= (<ShipStats>fleet.data.stats).cargoStats.fuelCapacity * 0.9
                                        //move scan area
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} coords ${fleet.state.Idle.sector[0]}, ${fleet.state.Idle.sector[1]}`);
                                            myLog(`need to move to ${orders[x].scanSector[0]}, ${orders[x].scanSector[1]}`);

                                            const Ix: InstructionReturn[] = [];

                                            var coordinatesTarget: BN[] = [new BN(orders[x].scanSector[0]), new BN(orders[x].scanSector[1])];

                                            if (Number(orders[x].fuel.delegatedAmount) >= (Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], coordinatesTarget as [BN, BN]) +
                                                Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, coordinatesTarget as [BN, BN], [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])])
                                            )) {
                                                Ix.push(Fleet.startSubwarp(
                                                    sageProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        toSector: coordinatesTarget,
                                                        keyIndex: 0,
                                                    },
                                                ));
                                            }
                                            else
                                                myLog(`not enough fuel to move to ${orders[x].newScanSector[0]}, ${orders[x].newScanSector[1]}`);

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransaction(Ix, walletSigner, connection, x);
                                                    orders[x].newScanSector[0] = Number(orders[x].scanSector[0]);
                                                    orders[x].newScanSector[1] = Number(orders[x].scanSector[1]);
                                                    orders[x].forceScan = true;
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.Idle && !(fleet.state.Idle.sector[0] == orders[x].baseSector[0] && fleet.state.Idle.sector[1] == orders[x].baseSector[1]) &&
                                        !(fleet.state.Idle.sector[0] == orders[x].newScanSector[0] && fleet.state.Idle.sector[1] == orders[x].newScanSector[1]) &&
                                        orders[x].toolAmount >= (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount
                                        //move scan
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} coords ${fleet.state.Idle.sector[0]}, ${fleet.state.Idle.sector[1]}`);
                                            myLog(`need to move to ${orders[x].newScanSector[0]}, ${orders[x].newScanSector[1]}`);

                                            const Ix: InstructionReturn[] = [];

                                            var coordinatesTarget: BN[] = [new BN(orders[x].newScanSector[0]), new BN(orders[x].newScanSector[1])];

                                            if (Number(orders[x].fuel.delegatedAmount) >= (Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], coordinatesTarget as [BN, BN]) +
                                                Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, coordinatesTarget as [BN, BN], [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])])
                                            )) {
                                                Ix.push(Fleet.startSubwarp(
                                                    sageProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        toSector: coordinatesTarget,
                                                        keyIndex: 0,
                                                    },
                                                ));
                                            }
                                            else
                                                myLog(`not enough fuel to move to ${orders[x].newScanSector[0]}, ${orders[x].newScanSector[1]}`);

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransaction(Ix, walletSigner, connection, x);
                                                    orders[x].forceScan = true;
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else if (fleet.state.MoveSubwarp
                                        //end subwarp
                                    ) {
                                        if (fleet.state.MoveSubwarp.arrivalTime - currentUnixTimestamp < randomWithinRange(-6, 0)) {
                                            {//if (!blockingActionDone) {
                                                myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} arrived, stopping `);

                                                const Ix: InstructionReturn[] = [];

                                                if (orders[x].fuelAccount == undefined) {

                                                    awaitRateLimit();
                                                    orders[x].fuelAccount = await getOrCreateAssociatedTokenAccount(
                                                        connection,
                                                        FUEL,
                                                        fleet.data.fuelTank,
                                                        true,
                                                    );
                                                    if (orders[x].fuelAccount.instructions != null) {
                                                        myLog(`no account fuel`);
                                                        Ix.push(orders[x].fuelAccount.instructions);
                                                    }
                                                    else {
                                                        awaitRateLimit();
                                                        orders[x].fuel = await getAccount(
                                                            connection,
                                                            orders[x].fuelAccount.address,
                                                            'processed',
                                                        );
                                                    }
                                                }

                                                awaitRateLimit();
                                                const fleetAccountInfo = await connection.getAccountInfo(
                                                    fleet.key,
                                                );

                                                const sectorFrom = Sector.findAddress(sageProgram, gameID, fleet.state.MoveSubwarp.fromSector as [BN, BN]);
                                                const sectorTo = Sector.findAddress(sageProgram, gameID, fleet.state.MoveSubwarp.toSector as [BN, BN]);

                                                Ix.push(Fleet.movementHandler(
                                                    sageProgram,
                                                    primaryProfile.key,
                                                    gameID,
                                                    game.data.gameState,
                                                    fleet.key,
                                                    fleetAccountInfo,
                                                    sectorFrom[0],
                                                    sectorTo[0],
                                                    fleet.data.fuelTank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FUEL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    orders[x].fuelAccount.address,
                                                    FUEL,
                                                    cargoProgram,
                                                ));

                                                Ix.push(Fleet.stopSubwarp(
                                                    sageProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    fleet.data.fuelTank,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        FUEL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    orders[x].fuelAccount.address,
                                                    FUEL,
                                                    gameID,
                                                    game.data.gameState,
                                                    cargoProgram,
                                                    { keyIndex: 0 },
                                                ));

                                                if (Ix.length > 0) {
                                                    try {
                                                        executeGenericTransaction(Ix, walletSigner, connection, x);
                                                        if (orders[x].toolAmount >= (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount)
                                                            orders[x].forceScan = true;
                                                        orders[x].refreshData = false;
                                                    }
                                                    catch (err) {
                                                        myLog(err.message);
                                                        orders[x].refreshData = true;
                                                    }
                                                }
                                            }
                                        }
                                        else
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} arrival in ${fleet.state.MoveSubwarp.arrivalTime - currentUnixTimestamp} seconds`);

                                        myLog(``);
                                    }
                                    else if (fleet.state.Idle && fleet.state.Idle.sector[0] == orders[x].newScanSector[0] && fleet.state.Idle.sector[1] == orders[x].newScanSector[1] &&
                                        orders[x].toolAmount >= (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount
                                        //scan
                                    ) {
                                        const Ix: InstructionReturn[] = [];

                                        var coordinates = fleet.state.Idle.sector;
                                        var sectorIndex = SurveyDataUnitTracker.findSectorIndex(
                                            coordinates as [BN, BN],
                                        );
                                        var sectorScanTimeBefore = trackerBefore.sectors[sectorIndex];

                                        if (fleet.data.scanCooldownExpiresAt.toNumber() - currentUnixTimestamp < randomWithinRange(-7, -1) &&
                                            ((sduMap[sectorIndex].probability >= orders[x].minProbabilityToStay || orders[x].forceScan) && currentUnixTimestamp - sectorScanTimeBefore >= 120)
                                        ) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} coords ${fleet.state.Idle.sector[0]}, ${fleet.state.Idle.sector[1]} scan`);
                                            myLog(`last SDU found before ${currentUnixTimestamp - sectorScanTimeBefore.toNumber()}s, my cooldown ${fleet.data.scanCooldownExpiresAt.toNumber() - currentUnixTimestamp}s`);

                                            if (orders[x].toolAmount >= (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount) {
                                                Ix.push(SurveyDataUnitTracker.scanForSurveyDataUnits(
                                                    sageProgram,
                                                    cargoProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    sduTracker[0].key,
                                                    fleet.data.cargoHold,
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        SDU,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    CargoType.findAddress(
                                                        cargoProgram,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                        TOOL,
                                                        cargoStatsDefinition[cargoStatsDefinition.length - 1].data.seqId,
                                                    )[0],
                                                    cargoStatsDefinition[cargoStatsDefinition.length - 1].key,
                                                    SDUfrom,
                                                    orders[x].sduTokenTo.address,
                                                    orders[x].toolAccount.address,
                                                    TOOL,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        keyIndex: 0,
                                                    }));

                                            }
                                            else
                                                myLog(`not enough toolkits ${orders[x].tool.delegatedAccount}`);
                                        }
                                        else
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} wait: last SDU found before ${currentUnixTimestamp - sectorScanTimeBefore.toNumber()}s, my cooldown ${fleet.data.scanCooldownExpiresAt.toNumber() - currentUnixTimestamp}s`);

                                        if (Ix.length > 0) {
                                            try {
                                                executeScan(Ix, walletSigner, connectionSecondary, x, fleet, trackerBefore);
                                            }
                                            catch (err) {
                                                myLog(err.message);
                                                orders[x].refreshData = true;
                                            }
                                        }
                                        myLog(``);
                                    }
                                    else if (fleet.state.Idle && !(fleet.state.Idle.sector[0] == orders[x].baseSector[0] && fleet.state.Idle.sector[1] == orders[x].baseSector[1]) &&
                                        orders[x].toolAmount < (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount
                                        //move base
                                    ) {
                                        if (!blockingActionDone) {
                                            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} coords ${fleet.state.Idle.sector[0]}, ${fleet.state.Idle.sector[1]}`);
                                            myLog(`need to move to ${orders[x].baseSector[0]}, ${orders[x].baseSector[1]}`);

                                            const Ix: InstructionReturn[] = [];

                                            var coordinatesTarget: BN[] = [new BN(orders[x].baseSector[0]), new BN(orders[x].baseSector[1])];

                                            if (orders[x].fuel.delegatedAmount >= Fleet.calculateSubwarpFuelBurnWithCoords(<ShipStats>fleet.data.stats, fleet.state.Idle.sector as [BN, BN], coordinatesTarget as [BN, BN])) {
                                                Ix.push(Fleet.startSubwarp(
                                                    sageProgram,
                                                    walletSigner,
                                                    primaryProfile.key,
                                                    factionKey,
                                                    fleet.key,
                                                    gameID,
                                                    game.data.gameState,
                                                    {
                                                        toSector: coordinatesTarget,
                                                        keyIndex: 0,
                                                    },
                                                ));
                                            }
                                            else
                                                myLog(`not enough fuel to move to ${orders[x].baseSector[0]}, ${orders[x].baseSector[1]}`);

                                            if (Ix.length > 0) {
                                                try {
                                                    executeGenericTransaction(Ix, walletSigner, connection, x);
                                                    orders[x].forceScan = false;
                                                }
                                                catch (err) {
                                                    myLog(err.message);
                                                }
                                                blockingActionDone = true;
                                                focusedOrderIdx = x;
                                            }

                                            myLog(``);
                                        }
                                    }
                                    else
                                        orders[x].refreshData = true;
                                }
                            }
                            else if (x == 0)
                                focusedOrderOnHold = true;

                            break;
                        }
                    }
                }
                catch (err) {
                    myLog(err.message);
                }

                await sleep(randomWithinRange(50, 200));

            }
        }
        catch (err) {
            myLog(err.message);
        }

        while ((Date.now() / 1000 | 0) - cycleStartTime < randomWithinRange(6, 9))
            await sleep(randomWithinRange(1000, 2500));
    }

    myLog(`End`);
}

async function initSDUmap(tracker: SurveyDataUnitTracker) {
    //initialize SDU map
    var currentUnixTimestamp = Date.now() / 1000 | 0;
    for (var g = 0; g < 10201; g++) {
        sduMap.push({
            maxDirection: 0,
            maxProb: probMax,
            probability: 0,
            lastTimeMeasured: 0
        });
    }
    for (var px = -50; px <= 50; px++) {
        for (var py = -50; py <= 50; py++) {
            var sectorIndex = SurveyDataUnitTracker.findSectorIndex([new BN(px), new BN(py)]);

            var distToMUD = calculateDistance([new BN(px), new BN(py)], [new BN(0), new BN(-39)]);
            var distToONI = calculateDistance([new BN(px), new BN(py)], [new BN(-40), new BN(30)]);
            var distToUST = calculateDistance([new BN(px), new BN(py)], [new BN(40), new BN(30)]);
            var dampeningMod = 1;
            if (distToMUD <= 30)
                dampeningMod = (distToMUD / 30);
            if (distToONI <= 30)
                dampeningMod = (distToONI / 30);
            if (distToUST <= 30)
                dampeningMod = (distToUST / 30);

            sduMap[sectorIndex].maxProb = probMax * dampeningMod;

            sduMap[sectorIndex].probability = currentUnixTimestamp - tracker.sectors[sectorIndex] * sduMap[sectorIndex].maxProb / 120;
            if (sduMap[sectorIndex].probability > sduMap[sectorIndex].maxProb)
                sduMap[sectorIndex].probability = sduMap[sectorIndex].maxProb;
        }
    }
    sduMapLastActualisation = currentUnixTimestamp;
}

async function executeScan(
    instructions: InstructionReturn[],
    signer: AsyncSigner,
    connection: Connection,
    index: number,
    fleet: Fleet,
    tracker: SurveyDataUnitTracker
): Promise<boolean> {
    let res: boolean = true;

    try {
        orders[index].runningPromise = true;

        awaitRateLimit();
        var currentUnixTimestamp = Date.now() / 1000 | 0;
        var result = await sendDynamicTransaction(instructions, signer, connection);
        var txInfo = await connection.getTransaction(result, {
            maxSupportedTransactionVersion: 1
        });
        var prob = txInfo != undefined ?
            (txInfo.meta != undefined ?
                (txInfo.meta.logMessages != undefined ?
                    (txInfo.meta.logMessages.find(Prob => Prob.startsWith("Program log: SDU probability:")) != undefined ?
                        Number(txInfo.meta.logMessages.find(Prob => Prob.startsWith("Program log: SDU probability:")).split(" ").pop()) : 0) : 0) : 0) : 0;
        if (prob == 0 || txInfo.meta.logMessages.find(Prob => Prob.startsWith("Program log: SDU probability:")) == undefined) {
            var txInfo = await connection.getTransaction(result, {
                maxSupportedTransactionVersion: 1
            });
            var prob = txInfo != undefined ?
                (txInfo.meta != undefined ?
                    (txInfo.meta.logMessages != undefined ?
                        (txInfo.meta.logMessages.find(Prob => Prob.startsWith("Program log: SDU probability:")) != undefined ?
                            Number(txInfo.meta.logMessages.find(Prob => Prob.startsWith("Program log: SDU probability:")).split(" ").pop()) : 0) : 0) : 0) : 0;
        }

        if (txInfo.meta.logMessages.find(Prob => Prob.startsWith("Program log: SDU probability:")) != undefined) {
            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} probability was  ${round(prob * 100, 2)}%`);

            var sectorIndex = SurveyDataUnitTracker.findSectorIndex(
                fleet.state.Idle.sector as [BN, BN]
            );
            myLog(`Fleet ${byteArrayToString(fleet.data.fleetLabel)} saved probability was  ${round(sduMap[sectorIndex].probability * 100, 2)}% maxProb ${round(sduMap[sectorIndex].maxProb * 100, 2)}%`);

            if (prob > sduMap[sectorIndex].maxProb || ((currentUnixTimestamp - tracker.sectors[sectorIndex]) > 120 && (currentUnixTimestamp - tracker.sectors[sectorIndex]) < 180)) {
                if (Math.abs(sduMap[sectorIndex].maxProb - prob) < 0.01)
                    sduMap[sectorIndex].maxDirection = (prob - sduMap[sectorIndex].maxProb > 0 ? 1 : -1);

                sduMap[sectorIndex].maxProb = prob;
            }

            sduMap[sectorIndex].probability = prob;
            sduMap[sectorIndex].lastTimeMeasured = currentUnixTimestamp;

            myLog(``);

            orders[index].toolAmount -= (<ShipStats>fleet.data.stats).miscStats.scanRepairKitAmount;
            orders[index].refreshData = false;
            orders[index].forceScan = false;
        }
        else {
            orders[index].refreshData = true;
        }
    }
    catch (err) {
        myLog(err.message);
        orders[index].refreshData = true;
    }

    orders[index].runningPromise = false;

    return res;
}

async function executeGenericTransaction(
    instructions: InstructionReturn[],
    signer: AsyncSigner,
    connection: Connection,
    index: number
): Promise<boolean> {
    let res: boolean = true;

    try {
        orders[index].runningPromise = true;
        awaitRateLimit();
        var result = await sendDynamicTransaction(instructions, signer, connection);

    }
    catch (err) {
        myLog(err.message);
    }

    orders[index].runningPromise = false;
    return res;
}

async function executeGenericTransactionWithFocus(
    instructions: InstructionReturn[],
    signer: AsyncSigner,
    connection: Connection,
    index: number
): Promise<boolean> {
    let res: boolean = true;

    try {
        orders[index].runningPromise = true;
        awaitRateLimit();
        var result = await sendDynamicTransaction(instructions, signer, connection);

    }
    catch (err) {
        myLog(err.message);
    }
    focusedOrderIdx = index;
    focusedOrderOnHold = true;

    orders[index].runningPromise = false;
    return res;
}

async function cleanStarbaseCargoPods(
    walletSigner: AsyncSigner,
    connection: Connection,
    sageProgram: SageIDLProgram,
    cargoProgram: CargoIDLProgram,
    playerProfile: PublicKey,
    playerFaction: PublicKey,
    starbasePlayer: PublicKey,
    gameState: PublicKey

) {
    awaitRateLimit();
    var starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer))
        .map(
            (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
        );

    while (starbaseCargoPods.length > 1) {
        myLog("Closing cargo pods");
        try {
            const cleanUpIx = await cleanUpStarbaseCargoPods(
                connection,
                sageProgram,
                cargoProgram,
                playerProfile,
                playerFaction,
                starbaseCargoPods[0].data.statsDefinition,
                gameID,
                gameState,
                walletSigner,
                0,
            );

            awaitRateLimit();
            const signedTxs = (
                await buildDynamicTransactions(cleanUpIx, walletSigner, {
                    connection,
                }, setComputeUnitPrice(4000))
            )._unsafeUnwrap();

            const results = await Promise.all(
                signedTxs.map((signedTx) => sendTransaction(signedTx, connection)),
            );
        } catch (e) {
            myLog(`Cargo pod closure exception ${e.message}`);
        }

        awaitRateLimit();
        starbaseCargoPods = (await getCargoPodsByAuthority(connection, cargoProgram, starbasePlayer))
            .map(
                (cargoPod) => cargoPod.type === 'ok' && cargoPod.data
            );
        await sleep(randomWithinRange(200, 800));
    }
}

function getMint(name: string) {
    var result;
    switch (name) {
        case 'Hydrogen':
            result = HYDROGEN;
            break;
        case 'Biomass':
            result = BIOMASS;
            break;
        case 'Carbon':
            result = CARBON;
            break;
        case 'Copper ore':
            result = COPPERORE;
            break;
        case 'Iron ore':
            result = IRONORE;
            break;
        case 'Lumanite':
            result = LUMANITE;
            break;
        case 'Rochinol':
            result = ROCHINOL;
            break;
        case 'Arco':
            result = ARCO;
            break;
        case 'Diamond':
            result = DIAMOND;
            break;
        case 'Fuel':
            result = FUEL;
            break;
        case 'Ammunition':
            result = AMMO;
            break;
        case 'Food':
            result = FOOD;
            break;
        case 'Toolkit':
            result = TOOL;
            break;
        case 'SDU':
            result = SDU;
            break;
        case 'Survey Data Unit':
            result = SDU;
            break;
        case 'Golden Ticket':
            result = GOLDENTICKET;
            break;
        case 'Energy Substrate':
            result = ENERGYSUBSTRATE;
            break;
        case 'Electromagnet':
            result = ELECTROMAGNET;
            break;
        case 'Framework':
            result = FRAMEWORK;
            break;
        case 'Power Source':
            result = POWERSOURCE;
            break;
        case 'Particle Acelerator':
            result = PARTICLEACCELERETOR;
            break;
        case 'Radiation Absorber':
            result = RADIATONABSORBER;
            break;
        case 'Super Conductor':
            result = SUPERCONDUCTOR;
            break;
        case 'Strange Emitter':
            result = STRANGEEMITTER;
            break;
        case 'Crystal Lattice':
            result = CRYSTALLATTICE;
            break;
        case 'Copper Wire':
            result = COPPERWIRE;
            break;
        case 'Copper':
            result = COPPER;
            break;
        case 'Electronics':
            result = ELECTRONICS;
            break;
        case 'Graphene':
            result = GRAPHENE;
            break;
        case 'Hydrocarbon':
            result = HYDROCARBON;
            break;
        case 'Iron':
            result = IRON;
            break;
        case 'Magnet':
            result = MAGNET;
            break;
        case 'Polymer':
            result = POLYMER;
            break;
        case 'Steel':
            result = STEEL;
            break;
    }
    return result;
}

function generateRoute(fleetStats: ShipStats, from: [BN, BN], to: [BN, BN], maxFuel: number, preferWarp: boolean) {
    var route: RouteStep[];

    var distToDestination = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2));
    var warpCount = distToDestination / fleetStats.movementStats.maxWarpDistance;
    var shortJumpDist = distToDestination % fleetStats.movementStats.maxWarpDistance;
    var needSubwarp = shortJumpDist < 2 && shortJumpDist > 0;

    var tempDestX = to[0] - from[0] / warpCount;
    var tempDestY = to[1] - from[1] / warpCount;
    var tempDestination: [BN, BN] = [tempDestX > 0 ? new BN(Math.ceil(tempDestX)) : new BN(Math.floor(tempDestX)), tempDestY > 0 ? new BN(Math.ceil(tempDestY)) : new BN(Math.floor(tempDestY))];
    var tempFuelWarp = Fleet.calculateWarpFuelBurnWithCoords(fleetStats, from, tempDestination);
    var tempFuelSubwarp = Fleet.calculateSubwarpFuelBurnWithCoords(fleetStats, tempDestination, to);
    var canWarp = maxFuel >= tempFuelWarp + tempFuelSubwarp;

    if (!preferWarp || !canWarp) {
        var fuelNeeded = Fleet.calculateSubwarpFuelBurnWithCoords(fleetStats, from, to);
        if (fuelNeeded <= maxFuel)
            route.push({
                from: from,
                to: to,
                warp: false
            });
    }
    else {

        var departure = from;
        for (var i = 0; i < Math.ceil(warpCount); i++) {
            if (i != 1 || !needSubwarp) {
                var destX = to[0] - from[0] / warpCount;
                var destY = to[1] - from[1] / warpCount;
                var destination: [BN, BN] = [destX > 0 ? new BN(Math.ceil(destX)) : new BN(Math.floor(destX)), destY > 0 ? new BN(Math.ceil(destY)) : new BN(Math.floor(destY))];
                route.push({
                    from: departure,
                    to: destination,
                    warp: true
                });
            }
            else {

            }
        }
    }
    return route;
}

export async function sendDynamicTransaction(
    instructions: InstructionReturn[],
    signer: AsyncSigner,
    connection: Connection,
    commitment: Finality = 'confirmed'
): Promise<TransactionSignature> {
    let txSignature: TransactionSignature;
    var sendLoop = true;

    while (sendLoop) {
        awaitRateLimit();
        const txs = await buildDynamicTransactions(instructions, signer, {
            connection,
        },
            setComputeUnitPrice(10000)
        );

        if (txs.isErr()) {
            myLog(`Error build ${txs.error}`);
        }

        if (!txs.isErr()) {
            try {
                for (const tx of txs.value) {
                    const result = await sendTransaction(tx, connection, {
                        commitment,
                        sendOptions: {
                            skipPreflight: false,
                        },
                    });

                    if (result.value.isErr()) {
                        myLog(`Error send ${result.value.error.toString()} ${result.value.error.valueOf()}`);
                        throw result.value.error;
                    }

                    txSignature = result.value.value;
                }
                sendLoop = false;
            }
            catch (e) {
                if (e.message == undefined || !(e.message as string).includes("Blockhash not found") && !(e.message as string).includes("block height exceeded") || txSignature != undefined) {
                    sendLoop = false;
                    myLog(`Tx send exception ${e.message}`);
                    if (e.logs != undefined)
                        for (var i = 0; i < e.logs.length - 1; i++) {
                            myLog(e.logs[i]);
                        }
                }

            }
        }
    }

    return txSignature;
}

export function setComputeUnitPrice(
    microLamports: number
): InstructionReturn {
    // eslint-disable-next-line require-await
    return async (funder) => [
        {
            instruction: ComputeBudgetProgram.setComputeUnitPrice({
                microLamports
            }),
            signers: [funder],
        }
    ];
}

async function prepareOrders() {
    orders = ordersJson.filter(function (el: any) {
        return el.role != "";
    });

    var index = 0;
    var activeOrders = 0;
    let timeNow = new Date().getTime();
    let unixtimenow = Date.now() / 1000 | 0;

    for (var prepIdx = 0; prepIdx < orders.length; prepIdx++) {

        orders[prepIdx].index = index;
        orders[prepIdx].runningPromise = false;
        orders[prepIdx].refreshData = true;
        if (orders[prepIdx].role == 'SDU') {
            if (orders[prepIdx].minProbabilityToStay == undefined || orders[prepIdx].minProbabilityToStay == 0)
                orders[prepIdx].minProbabilityToStay = 0.3;
            orders[prepIdx].forceScan = true;
        }

        activeOrders += orders[prepIdx].auto;

        index++;
    }


    myLog(`All orders: ${orders.length} - active orders: ${activeOrders}`);
}

function activateNewOrders() {
    try {
        myLog(`Starting update`);
        var rawData = fs.readFileSync("./src/orders.json").toString();
        ordersJson = JSON.parse(rawData);
        lastOrdersJson = rawData;

        for (var newIdx = 0; newIdx < orders.length; newIdx++) {
            try {
                if (orders[newIdx].role != "Crafting") {
                    var orderRead = ordersJson.filter(
                        (order: { fleetLabel: string; }) =>
                            order.fleetLabel != undefined && orders[newIdx].fleetLabel != undefined && order.fleetLabel === orders[newIdx].fleetLabel
                    );
                }
                else {
                    var orderRead = ordersJson.filter(
                        (order: { starbaseSector: number[]; recipe: string }) =>
                            order.starbaseSector != undefined && order.recipe != undefined &&
                            orders[newIdx].starbaseSector != undefined && orders[newIdx].recipe != undefined &&
                            order.starbaseSector[0] == orders[newIdx].starbaseSector[0] && order.starbaseSector[1] == orders[newIdx].starbaseSector[1] &&
                            order.recipe == orders[newIdx].recipe
                    );
                }

                if (orderRead != undefined && orderRead.length > 0) {
                    if (orderRead[0].role != undefined)
                        orders[newIdx].role = orderRead[0].role;
                    if (orderRead[0].auto != undefined)
                        orders[newIdx].auto = orderRead[0].auto;
                    if (orderRead[0].minAmmo != undefined)
                        orders[newIdx].minAmmo = orderRead[0].minAmmo;
                    if (orderRead[0].minFood != undefined)
                        orders[newIdx].minFood = orderRead[0].minFood;
                    if (orderRead[0].resource != undefined)
                        orders[newIdx].resource = orderRead[0].resource;
                    if (orderRead[0].baseSector != undefined)
                        orders[newIdx].baseSector = orderRead[0].baseSector;
                    if (orderRead[0].scanSector != undefined)
                        orders[newIdx].scanSector = orderRead[0].scanSector;
                    if (orderRead[0].destinationSector != undefined)
                        orders[newIdx].destinationSector = orderRead[0].destinationSector;
                    if (orderRead[0].routeToBase != undefined)
                        orders[newIdx].routeToBase = orderRead[0].routeToBase;
                    if (orderRead[0].cargoToBase != undefined)
                        orders[newIdx].cargoToBase = orderRead[0].cargoToBase;
                    if (orderRead[0].routeToDestination != undefined)
                        orders[newIdx].routeToDestination = orderRead[0].routeToDestination;
                    if (orderRead[0].cargoToDestination != undefined)
                        orders[newIdx].cargoToDestination = orderRead[0].cargoToDestination;
                    if (orderRead[0].minProbabilityToStay != undefined)
                        orders[newIdx].minProbabilityToStay = orderRead[0].minProbabilityToStay;
                    if (orderRead[0].starbaseSector != undefined)
                        orders[newIdx].starbaseSector = orderRead[0].starbaseSector;
                    if (orderRead[0].recipe != undefined)
                        orders[newIdx].recipe = orderRead[0].recipe;
                    if (orderRead[0].quantity != undefined)
                        orders[newIdx].quantity = orderRead[0].quantity;
                    if (orderRead[0].crew != undefined)
                        orders[newIdx].crew = orderRead[0].crew;

                    orders[newIdx].refreshData = true;
                }
            }
            catch (e) {
                console.log(e);
            }
        }
        refreshOrders = false;
    }
    catch {
        refreshOrders = false;
    }
}

function decimalPlaces(num: number) {
    var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) { return 0; }
    return Math.max(
        0,
        // Number of digits right of decimal point.
        (match[1] ? match[1].length : 0)
        // Adjust for scientific notation.
        - (match[2] ? +match[2] : 0));
}

function round(num: number, fractionDigits: number): number {
    let _pow = Math.pow(10, fractionDigits);
    return Number(((num * _pow) >> 0) / _pow);
}

/**
 * Get random int within range
 * @param min - the min value of the random number
 * @param max - the max value of the random number
 * @returns number
 */
export const randomWithinRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min)) + min;

export const randomUint8Arr = (): Uint8Array => {
    const byteArray = new Uint8Array(6);
    for (let i = 0; i < 6; i++) {
        byteArray[i] = (Math.random() * 256) & 0xff;
    }
    return byteArray;
};

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function awaitRateLimit() {
    while (new Date().getTime() - lastTxSend < 30)
        sleep(20);
    lastTxSend = new Date().getTime();
}

initWallet();