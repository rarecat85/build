const path = require('path');
const sass = require('sass');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
const CleanCSS = require('clean-css');

// SCSS 파일의 해시값 저장 객체
const fileHashes = {};

// SCSS 파일 종속성 맵
const dependencyMap = {};

// HTML 파일 해시값 저장 객체
const htmlFileHashes = {};

/**
 * 파일 해시 생성
 */
function generateFileHash(filePath) {
    if (!fs.existsSync(filePath)) {
        return '';
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(fileContent).digest('hex');
}

/**
 * CSS Minify
 */
function minifyCSS(cssContent) {
    const minified = new CleanCSS().minify(cssContent);
    if (minified.errors.length > 0) {
        console.error(`CSS Minify 오류:`, minified.errors);
        return cssContent; // Minify 실패 시 원본 반환
    }
    return minified.styles;
}

/**
 * SCSS 파일 컴파일
 */
function compileSCSS(filePath, cssDir) {
    const fileName = path.basename(filePath).replace(/\.scss$/, '.css');
    const cssFilePath = path.join(cssDir, fileName);

    try {
        // SCSS 컴파일
        const result = sass.compile(filePath);

        // Minify 처리
        const minifiedCSS = minifyCSS(result.css);

        // Minify된 CSS 저장
        fs.writeFileSync(cssFilePath, minifiedCSS, 'utf8');
        console.log(`${fileName} -> 변환 및 압축 성공!`);
        return minifiedCSS;
    } catch (error) {
        console.error(`${filePath} 변환 중 오류 발생:`, error);
        return '';
    }
}

/**
 * 컴포넌트 SCSS 파일 컴파일
 */
function compileComponentSCSS(componentPath, cssDir, outputCssFile) {
    // 컴포넌트 폴더에서 직접 SCSS 파일 찾기
    const scssFiles = fs.readdirSync(componentPath).filter(file => file.endsWith('.scss'));
    
    if (scssFiles.length === 0) {
        // scss 폴더가 있는지 확인 (대체 경로)
        const scssPath = path.join(componentPath, 'scss');
        if (fs.existsSync(scssPath)) {
            const nestedScssFiles = fs.readdirSync(scssPath).filter(file => file.endsWith('.scss'));
            if (nestedScssFiles.length === 0) {
                console.log(`컴포넌트 ${path.basename(componentPath)}에 SCSS 파일이 없습니다.`);
                return '';
            }
        } else {
            console.log(`컴포넌트 ${path.basename(componentPath)}에 SCSS 파일이 없습니다.`);
            return '';
        }
    }

    // CSS 디렉토리 확인 및 생성
    fs.mkdirSync(cssDir, { recursive: true });

    let combinedCSS = '';
    
    console.log(`컴포넌트 ${path.basename(componentPath)}의 SCSS 파일 컴파일 시작...`);
    
    // 컴포넌트 폴더의 SCSS 파일 처리
    scssFiles.forEach(file => {
        const filePath = path.join(componentPath, file);
        try {
            // SCSS 컴파일
            const result = sass.compile(filePath);
            combinedCSS += result.css;
            console.log(`컴포넌트 ${file} -> 변환 성공!`);
        } catch (error) {
            console.error(`${filePath} 변환 중 오류 발생:`, error);
        }
    });

    // scss 폴더가 있으면 해당 폴더의 파일도 처리
    const scssPath = path.join(componentPath, 'scss');
    if (fs.existsSync(scssPath)) {
        const nestedScssFiles = fs.readdirSync(scssPath).filter(file => file.endsWith('.scss'));
        
        nestedScssFiles.forEach(file => {
            const filePath = path.join(scssPath, file);
            try {
                // SCSS 컴파일
                const result = sass.compile(filePath);
                combinedCSS += result.css;
                console.log(`컴포넌트 scss/${file} -> 변환 성공!`);
            } catch (error) {
                console.error(`${filePath} 변환 중 오류 발생:`, error);
            }
        });
    }

    if (combinedCSS) {
        // 출력 CSS 파일이 없으면 생성
        if (!fs.existsSync(outputCssFile)) {
            fs.writeFileSync(outputCssFile, '', 'utf8');
            console.log(`CSS 파일 생성: ${outputCssFile}`);
        }
        
        // 기존 CSS 파일 읽기
        const existingCSS = fs.readFileSync(outputCssFile, 'utf8');
        
        // 이미 포함된 컴포넌트 CSS인지 확인 (중복 방지)
        const componentIdentifier = `/* Component: ${path.basename(componentPath)} */`;
        const componentCSS = `${componentIdentifier}\n${combinedCSS}\n/* End Component: ${path.basename(componentPath)} */\n`;
        
        let updatedCSS;
        
        if (existingCSS.includes(componentIdentifier)) {
            // 기존 컴포넌트 CSS 업데이트
            const componentRegex = new RegExp(
                `\\/\\* Component: ${path.basename(componentPath)} \\*\\/[\\s\\S]*?\\/\\* End Component: ${path.basename(componentPath)} \\*\\/\\n?`, 
                'g'
            );
            updatedCSS = existingCSS.replace(componentRegex, componentCSS);
            console.log(`컴포넌트 ${path.basename(componentPath)}의 CSS 업데이트`);
        } else {
            // 새 컴포넌트 CSS 추가
            updatedCSS = existingCSS + '\n' + componentCSS;
            console.log(`컴포넌트 ${path.basename(componentPath)}의 CSS 추가`);
        }
        
        // 파일에 저장 (Minify 처리는 호출 시점에서 결정)
        fs.writeFileSync(outputCssFile, updatedCSS, 'utf8');
        console.log(`컴포넌트 CSS가 '${path.basename(outputCssFile)}'에 저장됨`);
    }

    return combinedCSS;
}

/**
 * 종속성 맵 업데이트
 */
function updateDependencyMap(scssDir) {
    if (!fs.existsSync(scssDir)) {
        return;
    }

    const scssFiles = fs.readdirSync(scssDir).filter(file => file.endsWith('.scss'));

    scssFiles.forEach(file => {
        const filePath = path.join(scssDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = content.match(/@import\s+["']([^"']+)["']/g) || [];

        imports.forEach(importStatement => {
            const importedFile = importStatement
                .match(/@import\s+["']([^"']+)["']/)[1]
                .replace(/\.scss$/, '') + '.scss';
            const importedFilePath = path.join(scssDir, importedFile);

            // 종속성 맵에 추가
            if (!dependencyMap[importedFilePath]) {
                dependencyMap[importedFilePath] = [];
            }
            if (!dependencyMap[importedFilePath].includes(filePath)) {
                dependencyMap[importedFilePath].push(filePath);
            }
        });
    });

    console.log('종속성 맵 업데이트 완료');
}

/**
 * 컴포넌트 폴더 찾기
 */
function findComponentFolders(basePath) {
    const componentsPath = path.join(basePath, 'components');
    if (!fs.existsSync(componentsPath)) {
        console.log(`컴포넌트 폴더가 없습니다: ${componentsPath}`);
        return [];
    }

    const componentFolders = fs.readdirSync(componentsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => {
            return {
                name: dirent.name,
                path: path.join(componentsPath, dirent.name)
            };
        });

    console.log(`발견된 컴포넌트 폴더: ${componentFolders.map(f => f.name).join(', ')}`);
    return componentFolders;
}

/**
 * 컴포넌트 HTML 추출
 */
function extractComponentHTML(componentPath) {
    const htmlFiles = fs.readdirSync(componentPath)
        .filter(file => file.endsWith('.html'));

    if (htmlFiles.length === 0) {
        return { content: '', scripts: [], styles: [] };
    }

    const htmlPath = path.join(componentPath, htmlFiles[0]);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // 스크립트 태그 추출
    const scriptMatches = htmlContent.match(/<script\b[^>]*src=["'][^"']*\.js[^>]*><\/script>/g) || [];
    
    // 스타일 태그 추출
    const styleMatches = htmlContent.match(/<link\b[^>]*href=["'][^"']*\.css[^>]*>/g) || [];

    // 본문 내용 (스크립트와 스타일을 제외)
    let bodyContent = htmlContent;
    
    // <script> 태그 제거
    scriptMatches.forEach(script => {
        bodyContent = bodyContent.replace(script, '');
    });
    
    // <link> 태그 제거
    styleMatches.forEach(style => {
        bodyContent = bodyContent.replace(style, '');
    });

    return {
        content: bodyContent.trim(),
        scripts: scriptMatches,
        styles: styleMatches
    };
}

/**
 * 컴포넌트 태그 처리
 */
function processComponentTags(htmlContent, componentFolders, srcPath) {
    let processedHTML = htmlContent;
    let headScripts = [];
    
    // 각 컴포넌트에 대해
    componentFolders.forEach(component => {
        const componentTag = `{{${component.name}}}`;
        
        // 컴포넌트 태그가 HTML에 있는지 확인
        if (processedHTML.includes(componentTag)) {
            // 컴포넌트 HTML 추출
            const { content, scripts } = extractComponentHTML(component.path);
            
            // 컴포넌트 내용으로 태그 교체
            processedHTML = processedHTML.replace(new RegExp(componentTag, 'g'), content);
            
            // 스크립트 경로 수정 및 수집
            const modifiedScripts = scripts.map(script => {
                // ../../assets/ 경로를 ./assets/로 수정
                return script.replace(/(src=["'])(\.\.\/)*assets\//g, '$1./assets/');
            });
            
            headScripts = [...headScripts, ...modifiedScripts];
        } else {
            // 컴포넌트 태그가 없더라도 스크립트는 수집 (선택적)
            const { scripts } = extractComponentHTML(component.path);
            if (scripts.length > 0) {
                console.log(`컴포넌트 ${component.name}가 HTML에서 호출되지 않았지만, 관련 스크립트를 추가합니다.`);
                const modifiedScripts = scripts.map(script => {
                    return script.replace(/(src=["'])(\.\.\/)*assets\//g, '$1./assets/');
                });
                headScripts = [...headScripts, ...modifiedScripts];
            }
        }
        
        // 컴포넌트 SCSS 컴파일은 이미 별도로 처리됨
    });
    
    // 헤드 태그 찾기 및 스크립트만 삽입 (CSS 링크는 삽입하지 않음)
    const headMatch = processedHTML.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch && headScripts.length > 0) {
        const headContent = headMatch[1];
        const newHeadContent = headContent + '\n' + headScripts.join('\n');
        processedHTML = processedHTML.replace(headMatch[0], `<head>${newHeadContent}</head>`);
    }
    
    return processedHTML;
}

/**
 * 인덱스 HTML 처리 및 컴포넌트 통합
 */
function processIndexHTML(indexPath, componentFolders, srcPath, outputPath) {
    if (!fs.existsSync(indexPath)) {
        console.error(`index.html 파일이 없습니다: ${indexPath}`);
        return false;
    }
    
    // 인덱스 HTML 읽기
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 컴포넌트 태그 처리
    const processedHTML = processComponentTags(indexContent, componentFolders, srcPath);
    
    // 처리된 HTML 저장
    fs.writeFileSync(outputPath, processedHTML, 'utf8');
    console.log(`처리된 HTML 저장: ${outputPath}`);
    
    return true;
}

/**
 * 개발 서버 실행
 */
function startServer(folderName) {
    const currentDir = process.cwd();
    const srcPath = path.join(currentDir, folderName, 'src');
    const indexPath = path.join(srcPath, 'index.html');
    const mainHtmlPath = path.join(srcPath, 'main.html');
    
    // 감시 시작
    const useMainHtml = watchFiles(folderName);
    
    // index.html에 컴포넌트 호출이 있는지 확인한 결과에 따라 실행할 HTML 결정
    const htmlToOpen = useMainHtml ? 'main.html' : 'index.html';
    
    // Live Server 실행
    exec(`npx live-server ${srcPath} --open=${htmlToOpen} --wait=100`, (error, stdout, stderr) => {
        if (error) {
            console.error(`서버 실행 중 오류 발생: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`서버 오류 메시지: ${stderr}`);
        }
        console.log(stdout);
    });
    
    console.log(`
    ╔═══════════════════════════════════════════════════════════════════════════╗
    ║                                                                           ║
    ║     ██████╗ ███████╗██╗   ██╗██████╗     ██╗███████╗                      ║
    ║     ██╔══██╗██╔════╝██║   ██║╚════██╗   ███║██╔════╝                      ║
    ║     ██║  ██║█████╗  ██║   ██║ █████╔╝    ██║███████╗                      ║
    ║     ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔═══╝     ██║╚════██║                      ║
    ║     ██████╔╝███████╗ ╚████╔╝ ███████╗    ██║███████║                      ║
    ║     ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝    ╚═╝╚══════╝                      ║
    ║                                                                           ║
    ║     컴포넌트 기반 개발 서버가 실행 중입니다                                ║
    ║     http://localhost:8080/${htmlToOpen} 에서 확인하세요                    ║
    ║                                                                           ║
    ╚═══════════════════════════════════════════════════════════════════════════╝
    `);
}

/**
 * index.html에 컴포넌트 호출이 있는지 확인
 */
function hasComponentCalls(htmlContent, componentFolders) {
    if (!htmlContent || !componentFolders || componentFolders.length === 0) {
        return false;
    }
    
    // 각 컴포넌트의 호출 태그를 확인
    for (const component of componentFolders) {
        const componentTag = `{{${component.name}}}`;
        if (htmlContent.includes(componentTag)) {
            return true; // 하나라도 컴포넌트 호출이 있으면 true 반환
        }
    }
    
    return false; // 컴포넌트 호출이 없으면 false 반환
}

/**
 * 파일 변경 감지 및 처리
 */
function watchFiles(folderName) {
    const currentDir = process.cwd();
    const srcPath = path.join(currentDir, folderName, 'src');
    const componentsPath = path.join(srcPath, 'components');
    const scssDir = path.join(srcPath, 'assets/scss');
    const cssDir = path.join(srcPath, 'assets/css');
    const assetsDir = path.join(srcPath, 'assets');
    const indexPath = path.join(srcPath, 'index.html');
    const mainHtmlPath = path.join(srcPath, 'main.html');
    
    // 초기 컴포넌트 폴더 목록
    const componentFolders = findComponentFolders(srcPath);
    
    // CSS 디렉토리 생성
    fs.mkdirSync(cssDir, { recursive: true });
    
    // HTML에서 CSS 파일 참조 추출하여 mainCssFile 결정
    let mainCssFile = null; // 기본값을 null로 설정 (style.css 기본값 사용 안 함)
    
    // index.html 파일이 있는지 확인
    if (!fs.existsSync(indexPath)) {
        console.error(`index.html 파일이 없습니다: ${indexPath}`);
        return false;
    }
    
    // index.html 내용 읽기
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // index.html에 컴포넌트 호출이 있는지 확인
    const hasComponents = hasComponentCalls(indexContent, componentFolders);
    
    // CSS 파일 링크 찾기
    const cssLinkMatch = indexContent.match(/<link[^>]*href=["']([^"']*\.css)[^>]*>/);
    
    if (cssLinkMatch && cssLinkMatch[1]) {
        // 상대 경로에서 파일 이름만 추출
        const cssFileName = path.basename(cssLinkMatch[1]);
        mainCssFile = path.join(cssDir, cssFileName);
        console.log(`HTML에서 CSS 파일 참조 발견: ${cssFileName}`);
    } else {
        console.log(`HTML에서 CSS 파일 참조를 찾을 수 없습니다. 컴포넌트 CSS는 병합되지 않습니다.`);
    }
    
    // 메인 SCSS 파일 초기 컴파일
    let mainScssExists = false;
    if (fs.existsSync(scssDir)) {
        console.log('메인 SCSS 파일 초기 컴파일 시작...');
        const scssFiles = fs.readdirSync(scssDir).filter(file => {
            return file.endsWith('.scss') && !file.startsWith('_');
        });
        
        if (scssFiles.length > 0) {
            mainScssExists = true;
            scssFiles.forEach(file => {
                const filePath = path.join(scssDir, file);
                console.log(`메인 SCSS 파일 컴파일: ${file}`);
                compileSCSS(filePath, cssDir);
                fileHashes[filePath] = generateFileHash(filePath);
            });
        }
    }
    
    // 메인 CSS 파일이 지정되지 않았으면 찾거나 처리 중단
    if (!mainCssFile) {
        const cssFiles = fs.existsSync(cssDir) ? 
            fs.readdirSync(cssDir).filter(file => file.endsWith('.css') && file !== 'style.css') : [];
        
        if (cssFiles.length > 0) {
            mainCssFile = path.join(cssDir, cssFiles[0]);
            console.log(`기존 CSS 파일 사용: ${path.basename(mainCssFile)}`);
        } else if (componentFolders.length > 0) {
            // 컴포넌트가 있지만 메인 CSS가 없으면 기본 CSS 파일 생성
            mainCssFile = path.join(cssDir, 'main.css');
            fs.writeFileSync(mainCssFile, '', 'utf8');
            console.log(`컴포넌트용 기본 CSS 파일 생성: main.css`);
        } else {
            console.log(`CSS 파일을 찾을 수 없어 컴포넌트 CSS는 병합되지 않습니다.`);
            // mainCssFile은 null로 유지
        }
    }
    
    // mainCssFile이 null이 아닐 때만 컴포넌트 CSS 처리
    if (mainCssFile) {
        // 컴포넌트 CSS를 임시로 저장할 파일
        const tempComponentCssFile = path.join(cssDir, '_components.css');
        fs.writeFileSync(tempComponentCssFile, '', 'utf8');
        
        // 컴포넌트 SCSS 초기 컴파일 및 임시 파일에 합치기
        console.log('컴포넌트 SCSS 파일 초기 컴파일 시작...');
        
        // 모든 컴포넌트 처리 - 호출 여부와 상관없이 모든 컴포넌트의 SCSS 처리
        componentFolders.forEach(component => {
            console.log(`컴포넌트 SCSS 컴파일: ${component.name}`);
            
            // 컴포넌트 CSS를 임시 파일에 저장
            compileComponentSCSS(component.path, cssDir, tempComponentCssFile);
            
            // 컴포넌트 SCSS 파일 해시 저장
            const scssFiles = fs.readdirSync(component.path).filter(file => file.endsWith('.scss'));
            scssFiles.forEach(file => {
                const filePath = path.join(component.path, file);
                fileHashes[filePath] = generateFileHash(filePath);
            });
            
            // scss 하위 폴더가 있는 경우
            const scssDir = path.join(component.path, 'scss');
            if (fs.existsSync(scssDir)) {
                const nestedScssFiles = fs.readdirSync(scssDir).filter(file => file.endsWith('.scss'));
                nestedScssFiles.forEach(file => {
                    const filePath = path.join(scssDir, file);
                    fileHashes[filePath] = generateFileHash(filePath);
                });
            }
        });
        
        // 임시 컴포넌트 CSS 파일이 존재하면 메인 CSS 파일과 병합
        if (fs.existsSync(tempComponentCssFile)) {
            const componentCSS = fs.readFileSync(tempComponentCssFile, 'utf8');
            
            if (componentCSS.trim() !== '') {
                // 메인 CSS 파일 읽기
                const mainCSS = fs.existsSync(mainCssFile) ? fs.readFileSync(mainCssFile, 'utf8') : '';
                
                // 메인 CSS와 컴포넌트 CSS 병합
                const combinedCSS = mainCSS + '\n' + componentCSS;
                
                // 병합된 CSS minify하여 메인 CSS 파일에 저장
                const minifiedCSS = minifyCSS(combinedCSS);
                fs.writeFileSync(mainCssFile, minifiedCSS, 'utf8');
                console.log(`메인 CSS와 컴포넌트 CSS 병합 완료: ${path.basename(mainCssFile)}`);
            }
            
            // 임시 파일 삭제
            if (fs.existsSync(tempComponentCssFile)) {
                fs.unlinkSync(tempComponentCssFile);
            }
        }
    }
    
    // 기존에 생성된 style.css 파일이 있으면 삭제
    const styleFilePath = path.join(cssDir, 'style.css');
    if (fs.existsSync(styleFilePath)) {
        fs.unlinkSync(styleFilePath);
        console.log('불필요한 style.css 파일이 삭제되었습니다.');
    }
    
    // 컴포넌트 호출이 있는 경우에만 main.html 생성
    if (hasComponents) {
        // HTML 처리 - main.html 생성
        processIndexHTML(indexPath, componentFolders, srcPath, mainHtmlPath);
        console.log(`컴포넌트 호출이 감지되어 src 폴더에 main.html 생성 완료: ${mainHtmlPath}`);
    } else {
        console.log(`컴포넌트 호출이 없어 index.html을 그대로 사용합니다.`);
        // 만약 이전에 생성된 main.html이 있으면 삭제
        if (fs.existsSync(mainHtmlPath)) {
            fs.unlinkSync(mainHtmlPath);
            console.log(`기존 main.html 파일이 삭제되었습니다.`);
        }
    }
    
    // SCSS 파일 종속성 맵 업데이트
    updateDependencyMap(scssDir);
    
    // 모든 컴포넌트 폴더 내 SCSS 파일 종속성 맵 업데이트
    componentFolders.forEach(component => {
        // 컴포넌트 폴더의 SCSS 파일
        const scssFiles = fs.readdirSync(component.path).filter(file => file.endsWith('.scss'));
        if (scssFiles.length > 0) {
            updateDependencyMap(component.path);
        }
        
        // scss 하위 폴더가 있는 경우
        const componentScssDir = path.join(component.path, 'scss');
        if (fs.existsSync(componentScssDir)) {
            updateDependencyMap(componentScssDir);
        }
    });
    
    // SCSS 파일 변경 감지 함수
    function handleScssChange(filename, filePath, isMainScss = false) {
        const newHash = generateFileHash(filePath);
        
        if (fileHashes[filePath] !== newHash) {
            fileHashes[filePath] = newHash;
            
            if (isMainScss) {
                // 메인 SCSS 파일 변경 처리
                console.log(`메인 SCSS 파일 변경 감지: ${filename}`);
                
                // 파일이 _로 시작하는지 확인
                if (path.basename(filename).startsWith('_')) {
                    // 종속성 맵에서 이 파일을 참조하는 파일들 컴파일
                    if (dependencyMap[filePath]) {
                        dependencyMap[filePath].forEach(mainFile => {
                            compileSCSS(mainFile, cssDir);
                        });
                    }
                } else {
                    compileSCSS(filePath, cssDir);
                }
                
                // mainCssFile이 유효할 때만 컴포넌트 CSS 처리
                if (mainCssFile) {
                    // 임시 컴포넌트 CSS 파일 생성
                    const tempComponentCssFile = path.join(cssDir, '_components.css');
                    fs.writeFileSync(tempComponentCssFile, '', 'utf8');
                    
                    // 모든 컴포넌트 재컴파일
                    componentFolders.forEach(component => {
                        compileComponentSCSS(component.path, cssDir, tempComponentCssFile);
                    });
                    
                    // 메인 CSS와 컴포넌트 CSS 병합
                    if (fs.existsSync(tempComponentCssFile)) {
                        const componentCSS = fs.readFileSync(tempComponentCssFile, 'utf8');
                        
                        if (componentCSS.trim() !== '') {
                            // 메인 CSS 파일 읽기
                            const mainCSS = fs.existsSync(mainCssFile) ? fs.readFileSync(mainCssFile, 'utf8') : '';
                            
                            // 메인 CSS와 컴포넌트 CSS 병합
                            const combinedCSS = mainCSS + '\n' + componentCSS;
                            
                            // 병합된 CSS minify하여 메인 CSS 파일에 저장
                            const minifiedCSS = minifyCSS(combinedCSS);
                            fs.writeFileSync(mainCssFile, minifiedCSS, 'utf8');
                            console.log(`메인 CSS와 컴포넌트 CSS 병합 완료: ${path.basename(mainCssFile)}`);
                        }
                        
                        // 임시 파일 삭제
                        if (fs.existsSync(tempComponentCssFile)) {
                            fs.unlinkSync(tempComponentCssFile);
                        }
                    }
                    
                    // style.css 파일이 있으면 삭제
                    const styleFilePath = path.join(cssDir, 'style.css');
                    if (fs.existsSync(styleFilePath)) {
                        fs.unlinkSync(styleFilePath);
                        console.log('불필요한 style.css 파일이 삭제되었습니다.');
                    }
                }
            } else {
                // 컴포넌트 SCSS 파일 변경 처리
                console.log(`컴포넌트 SCSS 변경 감지: ${filename}`);
                
                // 메인 CSS 파일이 유효할 때만 처리
                if (mainCssFile) {
                    // 임시 컴포넌트 CSS 파일 생성
                    const tempComponentCssFile = path.join(cssDir, '_components.css');
                    fs.writeFileSync(tempComponentCssFile, '', 'utf8');
                    
                    // 모든 컴포넌트 재컴파일 (변경된 컴포넌트뿐만 아니라 모든 컴포넌트를 재컴파일)
                    console.log('모든 컴포넌트 SCSS 재컴파일...');
                    componentFolders.forEach(component => {
                        compileComponentSCSS(component.path, cssDir, tempComponentCssFile);
                    });
                    
                    // 메인 CSS와 컴포넌트 CSS 병합
                    if (fs.existsSync(tempComponentCssFile)) {
                        const componentCSS = fs.readFileSync(tempComponentCssFile, 'utf8');
                        
                        if (componentCSS.trim() !== '') {
                            // 메인 CSS 파일 읽기
                            const mainCSS = fs.existsSync(mainCssFile) ? fs.readFileSync(mainCssFile, 'utf8') : '';
                            
                            // 메인 CSS와 컴포넌트 CSS 병합
                            const combinedCSS = mainCSS + '\n' + componentCSS;
                            
                            // 병합된 CSS minify하여 메인 CSS 파일에 저장
                            const minifiedCSS = minifyCSS(combinedCSS);
                            fs.writeFileSync(mainCssFile, minifiedCSS, 'utf8');
                            console.log(`메인 CSS와 컴포넌트 CSS 병합 완료: ${path.basename(mainCssFile)}`);
                        }
                        
                        // 임시 파일 삭제
                        if (fs.existsSync(tempComponentCssFile)) {
                            fs.unlinkSync(tempComponentCssFile);
                        }
                    }
                    
                    // style.css 파일이 있으면 삭제
                    const styleFilePath = path.join(cssDir, 'style.css');
                    if (fs.existsSync(styleFilePath)) {
                        fs.unlinkSync(styleFilePath);
                        console.log('불필요한 style.css 파일이 삭제되었습니다.');
                    }
                    
                    // 컴포넌트 호출이 있는 경우에만 HTML 업데이트
                    if (hasComponents) {
                        // HTML도 다시 생성 (컴포넌트 변경 사항 반영)
                        processIndexHTML(indexPath, componentFolders, srcPath, mainHtmlPath);
                        console.log(`HTML 파일 업데이트: ${mainHtmlPath}`);
                    }
                }
            }
        }
    }
    
    // 인덱스 HTML 파일 변경 감지
    fs.watch(indexPath, (eventType) => {
        if (eventType === 'change') {
            console.log(`index.html 변경 감지`);
            
            // index.html 내용 다시 읽기
            const updatedIndexContent = fs.readFileSync(indexPath, 'utf8');
            
            // 컴포넌트 호출 여부 확인
            const updatedHasComponents = hasComponentCalls(updatedIndexContent, componentFolders);
            
            if (updatedHasComponents) {
                // 컴포넌트 호출이 있으면 main.html 생성
                processIndexHTML(indexPath, componentFolders, srcPath, mainHtmlPath);
                console.log(`컴포넌트 호출이 감지되어 main.html 업데이트됨`);
            } else if (fs.existsSync(mainHtmlPath)) {
                // 컴포넌트 호출이 없지만 main.html이 있으면 삭제
                fs.unlinkSync(mainHtmlPath);
                console.log(`컴포넌트 호출이 없어졌으므로 main.html 삭제됨`);
            }
        }
    });
    
    // SCSS 파일 변경 감지
    if (fs.existsSync(scssDir)) {
        fs.watch(scssDir, { recursive: true }, (eventType, filename) => {
            if (filename && eventType === 'change') {
                const filePath = path.join(scssDir, filename);
                handleScssChange(filename, filePath, true); // 메인 SCSS 파일
            }
        });
    }
    
    // 컴포넌트 폴더 내 파일 변경 감지
    if (fs.existsSync(componentsPath)) {
        fs.watch(componentsPath, { recursive: true }, (eventType, filename) => {
            if (filename) {
                const fullPathParts = filename.split(path.sep);
                const componentName = fullPathParts[0]; // components/컴포넌트명/파일.scss 또는 components/컴포넌트명/scss/파일.scss
                const componentPath = componentFolders.find(c => c.name === componentName)?.path;
                
                if (componentPath) {
                    const fullPath = path.join(componentsPath, filename);
                    
                    // SCSS 파일인 경우
                    if (filename.endsWith('.scss')) {
                        handleScssChange(filename, fullPath, false); // 컴포넌트 SCSS 파일
                    } 
                    // HTML 또는 기타 파일인 경우
                    else {
                        const newHash = generateFileHash(fullPath);
                        
                        if (htmlFileHashes[fullPath] !== newHash) {
                            htmlFileHashes[fullPath] = newHash;
                            console.log(`컴포넌트 파일 변경 감지: ${filename}`);
                            
                            // 컴포넌트 호출이 있는 경우에만 HTML 업데이트
                            if (hasComponents) {
                                // 모든 컴포넌트 재처리
                                processIndexHTML(indexPath, componentFolders, srcPath, mainHtmlPath);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 컴포넌트 호출 여부 반환 (startServer에서 사용)
    return hasComponents;
}

/**
 * 메인 함수
 */
function main() {
    const folderName = process.argv[2]; // 명령줄 인자로 하위 폴더명 받기
    
    if (!folderName) {
        console.error('Error: 실행할 하위 폴더명을 입력하세요.');
        console.log('Usage: node dev2.js <folderName>');
        process.exit(1);
    }
    
    startServer(folderName);
}

// 실행
main(); 