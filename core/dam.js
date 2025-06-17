const fs = require('fs').promises;
const path = require('path');
const { readFile, writeFile, mkdir, readdir } = fs;

/**
 * HTML 파일에서 에셋 경로를 수정하는 함수
 * @param {string} htmlContent - HTML 파일 내용
 * @param {string} newAssetPath - 새로운 에셋 경로
 * @returns {string} - 수정된 HTML 내용
 */
function replaceAssetPaths(htmlContent, newAssetPath) {
    // href, src, srcset 속성에서 ./ 또는 ../로 시작하는 경로를 완전히 대체
    htmlContent = htmlContent.replace(/(href|src|srcset)=["'](\.{1,2}\/[^"']+)["']/g, (match, attr, path) => {
        // ./ 또는 ../로 시작하는 부분을 모두 제거
        const relativePath = path.replace(/^\.{1,2}\//, '');
        return `${attr}="${newAssetPath}${relativePath}"`;
    });
    return htmlContent;
}

/**
 * CSS 파일에서 에셋 경로를 수정하는 함수
 * @param {string} cssContent - CSS 파일 내용
 * @param {string} newAssetPath - 새로운 에셋 경로
 * @returns {string} - 수정된 CSS 내용
 */
function replaceCssPaths(cssContent, newAssetPath) {
    // url() 함수 내의 경로 수정 (/src/ 또는 ../ 로 시작하는 경로를 완전히 대체)
    cssContent = cssContent.replace(/url\(['"]?(\/src\/[^'"\)]+)['"]?\)/g, (match, p1) => {
        return `url("${newAssetPath}${p1.replace(/^\/src\//, '')}")`;
    });
    cssContent = cssContent.replace(/url\(['"]?(\.\.\/[^'"\)]+)['"]?\)/g, (match, p1) => {
        return `url("${newAssetPath}${p1.replace(/^\.\.\//, '')}")`;
    });
    return cssContent;
}

/**
 * JS 파일에서 에셋 경로를 수정하는 함수
 * @param {string} jsContent - JS 파일 내용
 * @param {string} newAssetPath - 새로운 에셋 경로
 * @returns {string} - 수정된 JS 내용
 */
function replaceJsPaths(jsContent, newAssetPath) {
    // import 문에서 경로 대체
    jsContent = jsContent.replace(/import\s+['"](\/src\/[^'"]+)['"]/g, (match, p1) => {
        return `import "${newAssetPath}${p1.replace(/^\/src\//, '')}"`;
    });
    jsContent = jsContent.replace(/import\s+['"](\.\.\/[^'"]+)['"]/g, (match, p1) => {
        return `import "${newAssetPath}${p1.replace(/^\.\.\//, '')}"`;
    });

    // require 문에서 경로 대체
    jsContent = jsContent.replace(/require\(['"](\/src\/[^'"]+)['"]\)/g, (match, p1) => {
        return `require("${newAssetPath}${p1.replace(/^\/src\//, '')}")`;
    });
    jsContent = jsContent.replace(/require\(['"](\.\.\/[^'"]+)['"]\)/g, (match, p1) => {
        return `require("${newAssetPath}${p1.replace(/^\.\.\//, '')}")`;
    });

    // 일반 문자열 내 경로 대체 (예: '../assets/...')
    jsContent = jsContent.replace(/['"](\/src\/[^'"]+)['"]/g, (match, p1) => {
        return `"${newAssetPath}${p1.replace(/^\/src\//, '')}"`;
    });
    jsContent = jsContent.replace(/['"](\.\.\/[^'"]+)['"]/g, (match, p1) => {
        return `"${newAssetPath}${p1.replace(/^\.\.\//, '')}"`;
    });

    return jsContent;
}

/**
 * 파일 내용에서 대체할 경로가 있는지 확인하는 함수
 * @param {string} content - 파일 내용
 * @param {string} fileType - 파일 유형 ('css' 또는 'js')
 * @returns {boolean} - 대체할 경로가 있는지 여부
 */
function hasPathsToReplace(content, fileType) {
    if (fileType === 'css') {
        // CSS 파일 내의 url() 함수에서 경로 찾기
        return /url\(['"]?(\/src\/|\.\.\/)[^'"]+['"]?\)/.test(content);
    } else if (fileType === 'js') {
        // JS 파일 내의 import/require 문 및 일반 문자열 내 경로 찾기
        const importPattern = /import\s+['"](\/src\/|\.\.\/)[^'"]+['"]/;
        const requirePattern = /require\(['"](\/src\/|\.\.\/)[^'"]+['"]\)/;
        const generalPathPattern = /['"](\/src\/|\.\.\/)[^'"]+['"]/;
        return importPattern.test(content) || requirePattern.test(content) || generalPathPattern.test(content);
    }
    return false;
}

/**
 * CSS 파일을 처리하는 함수
 * @param {string} htmlContent - HTML 파일 내용
 * @param {string} cssDamDir - CSS 파일을 저장할 디렉토리
 * @param {string} sourceDir - 소스 디렉토리
 * @param {string} newAssetPath - 새로운 에셋 경로
 * @returns {Promise<string[]>} - 처리된 CSS 파일 목록
 */
async function processCssFiles(sourceDir, newAssetPath) {
    const cssDir = path.join(sourceDir, 'src', 'assets', 'css');
    const cssDamDir = path.join(sourceDir, 'src', 'assets', 'css_dam');
    const processedFiles = [];

    try {
        const files = await readdir(cssDir);
        const cssFiles = files.filter(file => file.endsWith('.css'));

        if (cssFiles.length > 0) {
            for (const file of cssFiles) {
                const sourcePath = path.join(cssDir, file);
                const content = await readFile(sourcePath, 'utf8');
                
                if (hasPathsToReplace(content, 'css')) {
                    if (processedFiles.length === 0) {
                        await mkdir(cssDamDir, { recursive: true });
                        console.log(`Directory created: ${cssDamDir}`);
                    }
                    
                    const targetPath = path.join(cssDamDir, file);
                    const modifiedContent = replaceCssPaths(content, newAssetPath);
                    await writeFile(targetPath, modifiedContent);
                    console.log(`File written: ${targetPath}`);
                    console.log(`CSS 파일 처리 완료: ${file}`);
                    processedFiles.push(file);
                }
            }
        }
    } catch (error) {
        console.error('CSS 파일 처리 중 오류 발생:', error);
    }

    return processedFiles;
}

/**
 * JS 파일을 처리하는 함수
 * @param {string} htmlContent - HTML 파일 내용
 * @param {string} jsDamDir - JS 파일을 저장할 디렉토리
 * @param {string} sourceDir - 소스 디렉토리
 * @param {string} newAssetPath - 새로운 에셋 경로
 * @returns {Promise<string[]>} - 처리된 JS 파일 목록
 */
async function processJsFiles(sourceDir, newAssetPath) {
    const jsDir = path.join(sourceDir, 'src', 'assets', 'js');
    const jsDamDir = path.join(sourceDir, 'src', 'assets', 'js_dam');
    const processedFiles = [];

    try {
        const files = await readdir(jsDir);
        const jsFiles = files.filter(file => file.endsWith('.js'));

        if (jsFiles.length > 0) {
            for (const file of jsFiles) {
                const sourcePath = path.join(jsDir, file);
                const content = await readFile(sourcePath, 'utf8');
                
                if (hasPathsToReplace(content, 'js')) {
                    if (processedFiles.length === 0) {
                        await mkdir(jsDamDir, { recursive: true });
                        console.log(`Directory created: ${jsDamDir}`);
                    }
                    
                    const targetPath = path.join(jsDamDir, file);
                    const modifiedContent = replaceJsPaths(content, newAssetPath);
                    await writeFile(targetPath, modifiedContent);
                    console.log(`File written: ${targetPath}`);
                    console.log(`JS 파일 처리 완료: ${file}`);
                    processedFiles.push(file);
                }
            }
        }
    } catch (error) {
        console.error('JS 파일 처리 중 오류 발생:', error);
    }

    return processedFiles;
}

/**
 * DAM 처리 메인 함수
 * @param {string} folderName - 대상 폴더 이름
 */
async function processDam(folderName) {
    try {
        const currentDir = process.cwd(); // 현재 실행 디렉토리
        const sourceDir = path.join(currentDir, folderName);
        const countryCode = folderName.toLowerCase();
        const newAssetPath = `/content/dam/channel/wcms/${countryCode}/lifes-good-campaign/2025/radio-optimism/lg-com-test/`;

        // HTML 파일 처리
        const htmlPath = path.join(sourceDir, 'src', 'radio.html');
        let htmlContent = await readFile(htmlPath, 'utf8');
        htmlContent = htmlContent.replace(/{국가코드}/g, countryCode);
        htmlContent = replaceAssetPaths(htmlContent, newAssetPath);
        await writeFile(htmlPath, htmlContent);
        console.log(`File written: ${htmlPath}`);

        // CSS 파일 처리
        const processedCssFiles = await processCssFiles(sourceDir, newAssetPath);
        if (processedCssFiles.length > 0) {
            console.log('Processed CSS files:', processedCssFiles.join(', '));
        }

        // JS 파일 처리
        const processedJsFiles = await processJsFiles(sourceDir, newAssetPath);
        if (processedJsFiles.length > 0) {
            console.log('Processed JS files:', processedJsFiles.join(', '));
        }

    } catch (error) {
        console.error('DAM 처리 중 오류 발생:', error);
    }
}

// 메인 실행 부분
const folderName = process.argv[2];
if (!folderName) {
    console.error('폴더명을 입력해주세요.');
    process.exit(1);
}

processDam(folderName); 