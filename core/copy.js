const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ExcelJS = require('exceljs');

/**
 * HTML 파일에서 data-tp dataset을 추출하는 함수
 */
function extractDataTpFromHTML(htmlContent, fileName) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const results = [];

    // data-tp 속성을 가진 모든 요소 찾기
    const elementsWithDataTp = document.querySelectorAll('[data-tp]');

    elementsWithDataTp.forEach((element, index) => {
        const dataTpValue = element.getAttribute('data-tp');
        const dataTpTypes = dataTpValue.split(' ').filter(type => type.trim());
        
        dataTpTypes.forEach(type => {
            let extractedValue = '';
            
            switch (type) {
                case 'label':
                    // aria-label 속성에서 값 추출
                    extractedValue = element.getAttribute('aria-label') || '';
                    break;
                    
                case 'copy':
                    // 요소의 텍스트 내용 추출 (HTML 태그 포함)
                    extractedValue = element.innerHTML || element.textContent || '';
                    break;
                    
                case 'alt':
                    // alt 속성에서 값 추출
                    extractedValue = element.getAttribute('alt') || '';
                    break;
                    
                case 'link':
                    // href 속성에서 값 추출
                    extractedValue = element.getAttribute('href') || '';
                    break;
                    
                default:
                    extractedValue = '';
            }
            
            // 특수문자 처리 (CSV/Excel 호환성을 위해)
            extractedValue = escapeSpecialCharacters(extractedValue);
            
            if (extractedValue.trim()) {
                results.push({
                    fileName: fileName,
                    type: type,
                    value: extractedValue.trim(),
                    originalIndex: index // 마크업 순서 유지를 위한 인덱스
                });
            }
        });
    });

    return results;
}

/**
 * 특수문자를 안전하게 처리하는 함수
 */
function escapeSpecialCharacters(text) {
    if (!text) return '';
    
    // HTML 엔티티 디코딩
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    
    // 줄바꿈 문자 정리
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 앞뒤 공백 제거
    text = text.trim();
    
    return text;
}

/**
 * 엑셀 파일 생성 함수
 */
async function createExcelFile(data, outputPath, sheetName) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // 헤더 설정 (File, Element, Data-TP 열 제거)
    worksheet.columns = [
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Value', key: 'value', width: 120 }
    ];
    
    // 데이터 추가
    data.forEach(row => {
        worksheet.addRow(row);
    });
    
    // 스타일 적용
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // 파일 저장
    await workbook.xlsx.writeFile(outputPath);
    console.log(`엑셀 파일이 생성되었습니다: ${outputPath}`);
}

/**
 * HTML 파일들을 처리하는 메인 함수
 */
async function processHTMLFiles(folderName) {
    // 실행하는 폴더를 기준으로 설정 (process.cwd() 대신 __dirname 사용)
    const executionDir = process.cwd();
    const targetFolder = path.join(executionDir, folderName);
    
    if (!fs.existsSync(targetFolder)) {
        console.error(`폴더를 찾을 수 없습니다: ${targetFolder}`);
        return;
    }
    
    console.log(`실행 폴더: ${executionDir}`);
    console.log(`처리 중인 폴더: ${targetFolder}`);
    
    // main.html 파일만 찾기
    const mainHtmlPath = path.join(targetFolder, 'src', 'main.html');
    
    if (!fs.existsSync(mainHtmlPath)) {
        console.error(`main.html 파일을 찾을 수 없습니다: ${mainHtmlPath}`);
        return;
    }
    
    console.log(`처리 중: src/main.html`);
    
    try {
        const htmlContent = fs.readFileSync(mainHtmlPath, 'utf8');
        const results = extractDataTpFromHTML(htmlContent, 'src/main.html');
        
        if (results.length === 0) {
            console.log('추출할 data-tp 데이터가 없습니다.');
            return;
        }
        
        // 마크업 순서대로 정렬
        results.sort((a, b) => a.originalIndex - b.originalIndex);
        
        // originalIndex 제거 (엑셀에 포함하지 않음)
        const finalResults = results.map(({ originalIndex, ...rest }) => rest);
        
        // 엑셀 파일 생성 (실행 폴더에 저장)
        const outputPath = path.join(executionDir, 'copy.xlsx');
        await createExcelFile(finalResults, outputPath, folderName);
        
        // 요약 정보 출력
        console.log('\n=== 추출 완료 ===');
        console.log(`총 ${finalResults.length}개의 항목이 추출되었습니다.`);
        
        const typeCounts = {};
        finalResults.forEach(result => {
            typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
        });
        
        console.log('\n타입별 개수:');
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}개`);
        });
        
        console.log(`\n엑셀 파일 위치: ${outputPath}`);
        
    } catch (error) {
        console.error(`파일 처리 중 오류 발생: ${mainHtmlPath}`, error);
    }
}

/**
 * 메인 실행 함수
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('사용법: node copy.js <폴더명>');
        console.log('예시: node copy.js sample');
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
    
    processHTMLFiles(folderName).catch(error => {
        console.error('처리 중 오류가 발생했습니다:', error);
        process.exit(1);
    });
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = {
    extractDataTpFromHTML,
    processHTMLFiles,
    createExcelFile
}; 