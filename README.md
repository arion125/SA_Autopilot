# SA_Autopilot
Program to automate Sage (actual iteration: Labs) repetitive tasks.

Disclaimer: Heavy WIP, not really intended to use by anybody, more like an example if somebody looks to resolve a certain problem. As I am no real programmer, just a hobby tinkerer, its by no means a nice structured piece of code.

#Current implementations
 - Automate crafting with possible recovery in case crafting resource deposit was not completed.
 - Automate SDU search by loading Toolkits, getting to a predesigned search area (just subwarp, not sure if warp is a good idea), search in a broad area for a high percentage based on settings and watching fuel level to always be able to return.
   If no more Toolkits return to base.
 - Mining a resource from an asteroid in a system with starbase. Loading food, fuel, ammo for that matter and unloading resource after mining. (Mining in a distatant sector could be easy implementet, just didn't see a reason for now)
 - Freighting resources between a base (where the fuel for the freighter will be replenished) and a destination. Route is made by a definition of hops (settings include if its a warp or a subwarp).

#Usage
 - Install npm if you don't have it already.
 - Open a command prompt, navigate to the root of your downloaded copy of SA_Autopilot
 - Run npm install
 - In the src/config.json, put your RPC Endpoint (Its an array of RPC Endpoints, right now the main endpoint is used for most tasks, the secondary, if provided, is used just to scan).
 - Run npm start. This will ask you to for your private key (you get it from any wallet) and a 32 character password that will be used to encrypt that private key and store the result in the config.json file.
 - Best thing would be to configure tasks in the src/orders.json file. Example of configuration provided. Changes can be made in runtime but adding new fleet or changing the name of the fleet needs a restart.
 - Run with npm start {password} or start_windows.cmd {password} if you like it to be restartet if some uncaught exception happens.

 - If any interaction with the fleet has to be made through the UI, best practice would be to put auto=false for that fleet, wait one cycle, do what you need to do and if you want to let it continue, set it back to auto.


It will definitely have bugs and situations that I don't use will probaby not really work, like was stated, not really intended to be used.
As I was trying to save transactions, some states are saved, menaning it could happen that a fleet has an old state, especially if you interact with it through the UI.
