@echo off
rem chcp 65001
set curl_path=C:\Program Files\Git\mingw64\bin\
rem set path=%curl_path%;%path%

SET XURL= http://localhost:7071/api/downloadmultyBlob?containerName=test-container-psh
SET XRES=downloadMultyBlob_1.res 

curl -k -i -X GET %XURL%  -o %XRES%  

type %XRES%
@echo off 
echo . 





