@echo off
rem chcp 65001
set curl_path=C:\Program Files\Git\mingw64\bin\
rem set path=%curl_path%;%path%

SET XURL= http://localhost:7071/api/uploadBlob
SET XRES=uploadBlob_3.res 

curl -k -i -X POST %XURL%  --header "Content-Type:multipart/form-data" ^
-F "reportDate=2025-07-01" ^
-F "file=@./testimg/pic-01.png" ^
-o %XRES%  

type %XRES%
@echo off 
echo . 





