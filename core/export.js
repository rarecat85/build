const fs = require('fs');
const path = require('path');

/**
 * 파일 내용 읽기
 */
function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * 파일 쓰기
 */
function writeFile(filePath, content) {
    if (typeof content === 'string') {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`File written: ${filePath}`);
    } else {
        console.error('Error: Provided content is not a string:', content);
        throw new Error('Invalid content type for writeFile');
    }
}

/**
 * 대상 HTML에서 필요한 조각 추출
 */
function extractHtmlParts(htmlContent) {
    const styleMatches = htmlContent.match(/<link[^>]*href=["'][^"']*\.css[^>]*>/g) || [];
    const jsMatches = htmlContent.match(/<script[^>]*src=["'][^"']*\.js[^>]*><\/script>/g) || [];
    const bodyContentMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    let bodyContent = bodyContentMatch ? bodyContentMatch[1] : '';

    // <body> 내용에서 <script src="..."> 제거
    if (jsMatches.length > 0) {
        bodyContent = bodyContent.replace(new RegExp(jsMatches.join('|'), 'g'), '').trim();
    }

    return {
        stylePart: styleMatches.join('\n'),
        jsPart: jsMatches.join('\n'),
        bodyContent: bodyContent,
    };
}

/**
 * 템플릿에 조각 삽입
 */
function injectHtmlParts(templateContent, parts) {
    return templateContent
        .replace('<styleSlot/>', parts.stylePart || '')
        .replace('<jsSlot/>', parts.jsPart || '')
        .replace('<contentSlot/>', parts.bodyContent || '');
}

/**
 * 템플릿 파일 찾기
 */
function findTemplateFile(templateDir, templateName) {
    const supportedExtensions = ['.html', '.jsp']; // 지원 확장자
    for (const ext of supportedExtensions) {
        const filePath = path.join(templateDir, templateName + ext);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}

/**
 * export 처리
 */
function exportHtml(targetFolder, templateName) {
    const currentDir = process.cwd();
    const projectName = path.basename(currentDir); // 현재 디렉토리 이름 추출 (test1, test2 등)
    const templateDir = path.join(currentDir, '..', 'template'); // 상위 디렉토리의 template 폴더
    const templateFilePath = findTemplateFile(templateDir, templateName);

    if (!templateFilePath) {
        console.error(`Error: 템플릿 파일이 존재하지 않습니다: ${templateName}`);
        process.exit(1);
    }

    const targetIndexPath = path.join(currentDir, targetFolder, 'src', 'index.html');
    if (!fs.existsSync(targetIndexPath)) {
        console.error(`Error: 대상 폴더에 index.html 파일이 없습니다: ${targetIndexPath}`);
        process.exit(1);
    }

    // 템플릿 읽기
    const templateContent = readFile(templateFilePath);

    // 대상 index.html 읽기
    const targetHtmlContent = readFile(targetIndexPath);

    // HTML 조각 추출
    const htmlParts = extractHtmlParts(targetHtmlContent);

    // 템플릿에 삽입
    const newContent = injectHtmlParts(templateContent, htmlParts);

    // 결과 파일을 src 폴더 안에 작성
    const outputExtension = path.extname(templateFilePath); // 템플릿의 확장자 유지 (.html, .jsp 등)
    const outputFilePath = path.join(currentDir, targetFolder, 'src', `${projectName}${outputExtension}`);
    writeFile(outputFilePath, newContent);

    console.log(`Export 완료: ${outputFilePath}`);
}

/**
 * 명령 실행
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length !== 2) {
        console.error('Usage: npm run export -- <targetFolder> <templateName>');
        process.exit(1);
    }

    const [targetFolder, templateName] = args;

    exportHtml(targetFolder, templateName);

    console.log(`
    ░▒▓█▓▒░      ░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░░▒▓███████▓▒░       ░▒▓██████▓▒░ ░▒▓██████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░  
    ░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
    ░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
    ░▒▓█▓▒░      ░▒▓█▓▒░▒▓██████▓▒░ ░▒▓██████▓▒░  ░▒▓██████▓▒░       ░▒▓█▓▒▒▓███▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
    ░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
    ░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░             ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
    ░▒▓████████▓▒░▒▓█▓▒░▒▓█▓▒░      ░▒▓████████▓▒░▒▓███████▓▒░        ░▒▓██████▓▒░ ░▒▓██████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░  
                                                                                                                           
                                                                                                                           
    `)
}

main();
