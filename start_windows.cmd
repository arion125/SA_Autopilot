@echo off
:startover
cd .\
echo (%time%) Bot started.
set arg1=%1
set arg2=%2
set arg3=%3
set arg4=%4
call npm start %arg1% %arg2% %arg3% %arg4%
echo (%time%) Bot closed, restarting.
goto startover