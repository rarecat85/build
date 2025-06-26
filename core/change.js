const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ExcelJS = require('exceljs');

/**
 * 엑셀 파일에서 데이터를 읽어오는 함수
 */
async function readExcelData(excelPath, sheetName) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const worksheet = workbook.getWorksheet(sheetName);
        if (!worksheet) {
            throw new Error(`시트 '${sheetName}'을 찾을 수 없습니다.`);
        }
        
        const data = [];
        let rowNumber = 1;
        
        // 모든 행을 순서대로 읽기
        worksheet.eachRow((row, index) => {
            if (index > 1) { // 헤더 제외
                const type = row.getCell(1).value;
                const value = row.getCell(2).value;
                
                // type이 있으면 value가 비어있어도 추가
                if (type) {
                    data.push({ 
                        type, 
                        value: value ? value.toString() : '',
                        rowNumber: rowNumber
                    });
                    rowNumber++;
                }
            }
        });
        
        console.log(`엑셀에서 읽어온 데이터: ${data.length}개`);
        return data;
    } catch (error) {
        console.error('엑셀 파일 읽기 오류:', error.message);
        return null;
    }
}

/**
 * HTML 파일에서 data-tp dataset을 찾아서 값을 변경하는 함수
 */
function updateHTMLWithDataTp(htmlContent, excelData) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // data-tp 속성을 가진 모든 요소 찾기
    const elementsWithDataTp = document.querySelectorAll('[data-tp]');
    let updateCount = 0;
    let dataIndex = 0;
    
    elementsWithDataTp.forEach((element) => {
        const dataTpValue = element.getAttribute('data-tp');
        const dataTpTypes = dataTpValue.split(' ').filter(type => type.trim());
        
        dataTpTypes.forEach(type => {
            // 엑셀 데이터에서 해당 타입의 값을 순서대로 찾기
            const excelRow = excelData.find(row => row.type === type);
            
            if (excelRow) {
                switch (type) {
                    case 'label':
                        // aria-label 속성 업데이트
                        element.setAttribute('aria-label', excelRow.value);
                        updateCount++;
                        console.log(`[${updateCount}] label 업데이트: ${excelRow.value}`);
                        break;
                        
                    case 'copy':
                        // 요소의 내용 업데이트 (HTML 태그 포함)
                        element.innerHTML = excelRow.value;
                        updateCount++;
                        console.log(`[${updateCount}] copy 업데이트: ${excelRow.value.substring(0, 50)}...`);
                        break;
                        
                    case 'alt':
                        // alt 속성 업데이트
                        element.setAttribute('alt', excelRow.value);
                        updateCount++;
                        console.log(`[${updateCount}] alt 업데이트: ${excelRow.value}`);
                        break;
                        
                    case 'link':
                        // href 속성 업데이트
                        element.setAttribute('href', excelRow.value);
                        updateCount++;
                        console.log(`[${updateCount}] link 업데이트: ${excelRow.value}`);
                        break;
                }
            }
        });
    });
    
    console.log(`총 ${updateCount}개의 항목이 업데이트되었습니다.`);
    return dom.serialize();
}

/**
 * HTML 파일에서 data-tp dataset을 찾아서 값을 변경하는 함수 (순서대로 매칭)
 */
function updateHTMLWithDataTpSequential(htmlContent, excelData) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // data-tp 속성을 가진 모든 요소 찾기
    const elementsWithDataTp = document.querySelectorAll('[data-tp]');
    let updateCount = 0;
    let dataIndex = 0;
    
    elementsWithDataTp.forEach((element) => {
        const dataTpValue = element.getAttribute('data-tp');
        const dataTpTypes = dataTpValue.split(' ').filter(type => type.trim());
        
        dataTpTypes.forEach(type => {
            // 엑셀 데이터에서 해당 타입의 값을 순서대로 찾기
            if (dataIndex < excelData.length) {
                const excelRow = excelData[dataIndex];
                
                if (excelRow && excelRow.type === type) {
                    switch (type) {
                        case 'label':
                            // aria-label 속성 업데이트
                            element.setAttribute('aria-label', excelRow.value);
                            updateCount++;
                            console.log(`[${updateCount}] label 업데이트: ${excelRow.value}`);
                            break;
                            
                        case 'copy':
                            // 요소의 내용 업데이트 (HTML 태그 포함)
                            element.innerHTML = excelRow.value;
                            updateCount++;
                            console.log(`[${updateCount}] copy 업데이트: ${excelRow.value.substring(0, 50)}...`);
                            break;
                            
                        case 'alt':
                            // alt 속성 업데이트
                            element.setAttribute('alt', excelRow.value);
                            updateCount++;
                            console.log(`[${updateCount}] alt 업데이트: ${excelRow.value}`);
                            break;
                            
                        case 'link':
                            // href 속성 업데이트
                            element.setAttribute('href', excelRow.value);
                            updateCount++;
                            console.log(`[${updateCount}] link 업데이트: ${excelRow.value}`);
                            break;
                    }
                    dataIndex++;
                }
            }
        });
    });
    
    console.log(`총 ${updateCount}개의 항목이 업데이트되었습니다.`);
    return dom.serialize();
}

/**
 * HTML 파일을 업데이트하는 메인 함수
 */
async function updateHTMLFiles(folderName) {
    const executionDir = process.cwd();
    const targetFolder = path.join(executionDir, folderName);
    const excelPath = path.join(executionDir, 'copy.xlsx');
    
    // 대상 폴더 확인
    if (!fs.existsSync(targetFolder)) {
        console.error(`폴더를 찾을 수 없습니다: ${targetFolder}`);
        return;
    }
    
    // 엑셀 파일 확인
    if (!fs.existsSync(excelPath)) {
        console.error(`copy.xlsx 파일을 찾을 수 없습니다: ${excelPath}`);
        console.error('먼저 npm run copy <폴더명>을 실행하여 copy.xlsx 파일을 생성해주세요.');
        return;
    }
    
    console.log(`실행 폴더: ${executionDir}`);
    console.log(`대상 폴더: ${targetFolder}`);
    console.log(`엑셀 파일: ${excelPath}`);
    
    // 엑셀 데이터 읽기
    console.log(`\n엑셀 파일에서 '${folderName}' 시트 데이터를 읽는 중...`);
    const excelData = await readExcelData(excelPath, folderName);
    
    if (!excelData || excelData.length === 0) {
        console.error(`'${folderName}' 시트에서 데이터를 찾을 수 없습니다.`);
        return;
    }
    
    console.log(`읽어온 데이터: ${excelData.length}개`);
    
    // index.html 파일 찾기
    const indexHtmlPath = path.join(targetFolder, 'src', 'index.html');
    
    if (!fs.existsSync(indexHtmlPath)) {
        console.error(`index.html 파일을 찾을 수 없습니다: ${indexHtmlPath}`);
        return;
    }
    
    console.log(`\n처리 중: src/index.html`);
    
    try {
        // HTML 파일 읽기
        const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // HTML 업데이트 (순서대로 매칭하는 함수 사용)
        const updatedHtml = updateHTMLWithDataTpSequential(htmlContent, excelData);
        
        // 백업 파일 생성
        const backupPath = indexHtmlPath + '.backup';
        fs.writeFileSync(backupPath, htmlContent, 'utf8');
        console.log(`백업 파일 생성: ${backupPath}`);
        
        // 업데이트된 HTML 저장
        fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');
        console.log(`\n=== 업데이트 완료 ===`);
        console.log(`파일 위치: ${indexHtmlPath}`);
        console.log(`백업 파일: ${backupPath}`);
        
    } catch (error) {
        console.error(`파일 처리 중 오류 발생: ${indexHtmlPath}`, error);
    }
}

/**
 * 메인 실행 함수
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('사용법: node change.js <폴더명>');
        console.log('예시: node change.js MX');
        console.log('\n주의: 먼저 npm run copy <폴더명>을 실행하여 copy.xlsx 파일을 생성해야 합니다.');
        process.exit(1);
    }
    
    const folderName = args[0];
    
    // JSDOM과 ExcelJS가 설치되어 있는지 확인
    try {
        require('jsdom');
        require('exceljs');
    } catch (error) {
        console.error('필요한 의존성이 설치되지 않았습니다.');
        console.error('다음 명령어로 설치해주세요:');
        console.error('npm install jsdom exceljs');
        process.exit(1);
    }
    
    updateHTMLFiles(folderName).catch(error => {
        console.error('처리 중 오류가 발생했습니다:', error);
        process.exit(1);
    });
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = {
    readExcelData,
    updateHTMLWithDataTp,
    updateHTMLWithDataTpSequential,
    updateHTMLFiles
}; 