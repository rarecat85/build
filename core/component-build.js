const fs = require('fs');
const path = require('path');
const sass = require('sass');
const CleanCSS = require('clean-css');

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
 * assets 폴더만 복사하는 함수
 */
function copyAssetsFolder(source, target) {
    const sourceAssetsDir = path.join(source, 'src', 'assets');
    const targetAssetsDir = path.join(target, 'src', 'assets');
    
    // src 폴더가 없으면 생성
    fs.mkdirSync(path.join(target, 'src'), { recursive: true });
    
    // assets 폴더가 없으면 종료
    if (!fs.existsSync(sourceAssetsDir)) {
        console.log(`assets 폴더가 존재하지 않습니다: ${sourceAssetsDir}`);
        return;
    }
    
    // assets 폴더 복사
    copyFolderRecursive(sourceAssetsDir, targetAssetsDir);
    console.log(`assets 폴더 복사 완료: ${sourceAssetsDir} -> ${targetAssetsDir}`);
}

/**
 * common 폴더 복사 함수
 */
function copyCommonFolder(source, target) {
    const sourceCommonDir = path.join(source, 'common');
    const targetCommonDir = path.join(target, 'common');
    
    // common 폴더가 없으면 종료
    if (!fs.existsSync(sourceCommonDir)) {
        console.log(`common 폴더가 존재하지 않습니다: ${sourceCommonDir}`);
        return;
    }
    
    // common 폴더 복사
    copyFolderRecursive(sourceCommonDir, targetCommonDir);
    console.log(`common 폴더 복사 완료: ${sourceCommonDir} -> ${targetCommonDir}`);
}

/**
 * 폴더 재귀적 복사 함수
 */
function copyFolderRecursive(source, target) {
    // 대상 폴더 생성
    fs.mkdirSync(target, { recursive: true });
    
    // 소스 폴더의 파일/폴더 가져오기
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    // 모든 항목 복사
    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);
        
        if (entry.isDirectory()) {
            // 하위 폴더 복사
            copyFolderRecursive(sourcePath, targetPath);
        } else {
            // 파일 복사
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`파일 복사: ${sourcePath} -> ${targetPath}`);
        }
    }
}

/**
 * 컴포넌트 폴더 찾기
 */
function findComponentFolders(basePath) {
    const componentsPath = path.join(basePath, 'src', 'components');
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
 * 컴포넌트의 SCSS 파일 컴파일 및 CSS 파일에 병합
 */
function processComponentScss(componentFolders, targetCssFile) {
    // 타겟 CSS 파일이 없으면 생성
    if (!fs.existsSync(targetCssFile)) {
        console.log(`${targetCssFile} 파일이 존재하지 않습니다. 새로 생성합니다.`);
        fs.writeFileSync(targetCssFile, '', 'utf8');
    }
    
    // 기존 CSS 파일 내용 읽기
    let cssContent = fs.readFileSync(targetCssFile, 'utf8');
    
    // 각 컴포넌트의 스타일이 이미 포함되어 있는지 확인
    let allComponentsFound = true;
    
    for (const component of componentFolders) {
        const componentClass = `.${component.name}`;
        
        if (!cssContent.includes(componentClass)) {
            allComponentsFound = false;
            console.log(`컴포넌트 ${component.name}의 스타일이 CSS에 없습니다. 새로 컴파일합니다.`);
            break;
        }
    }
    
    // 모든 컴포넌트 스타일이 이미 있으면 중단
    if (allComponentsFound) {
        console.log('모든 컴포넌트 스타일이 이미 CSS에 포함되어 있습니다. 추가 처리를 건너뜁니다.');
        return;
    }
    
    // 새로운 CSS 컴포넌트 스타일만 처리
    console.log('CSS 파일을 처음부터 새로 생성합니다.');
    
    // 메인 CSS 추출 (컴포넌트 스타일을 제외한 부분)
    let mainCSS = cssContent;
    
    // 컴포넌트 스타일 삭제 (이미 있을 수 있는 스타일을 제거)
    for (const component of componentFolders) {
        const componentClass = `.${component.name}`;
        // 컴포넌트 클래스를 포함하는 CSS 규칙을 찾아 제거
        const regex = new RegExp(`\\.${component.name}\\s*{[^}]*}`, 'g');
        mainCSS = mainCSS.replace(regex, '');
    }
    
    // 새 컴포넌트 CSS 생성
    let combinedComponentCSS = '';
    
    // 각 컴포넌트 폴더에서 SCSS 파일 처리
    for (const component of componentFolders) {
        console.log(`컴포넌트 ${component.name}의 SCSS 파일 처리 중...`);
        
        // 컴포넌트 직접 경로의 SCSS 파일
        const scssFiles = fs.readdirSync(component.path).filter(file => file.endsWith('.scss'));
        for (const file of scssFiles) {
            const scssPath = path.join(component.path, file);
            try {
                const result = sass.compile(scssPath);
                combinedComponentCSS += `/* Component: ${component.name} - ${file} */\n${result.css}\n`;
                console.log(`컴포넌트 ${component.name}의 ${file} 컴파일 완료`);
            } catch (error) {
                console.error(`컴포넌트 ${component.name}의 ${file} 컴파일 중 오류 발생:`, error);
            }
        }
        
        // scss 하위 폴더의 SCSS 파일
        const scssDir = path.join(component.path, 'scss');
        if (fs.existsSync(scssDir)) {
            const nestedScssFiles = fs.readdirSync(scssDir).filter(file => file.endsWith('.scss'));
            for (const file of nestedScssFiles) {
                const scssPath = path.join(scssDir, file);
                try {
                    const result = sass.compile(scssPath);
                    combinedComponentCSS += `/* Component: ${component.name} - scss/${file} */\n${result.css}\n`;
                    console.log(`컴포넌트 ${component.name}의 scss/${file} 컴파일 완료`);
                } catch (error) {
                    console.error(`컴포넌트 ${component.name}의 scss/${file} 컴파일 중 오류 발생:`, error);
                }
            }
        }
    }
    
    // 최종 CSS 합치기
    if (combinedComponentCSS) {
        // 메인 CSS와 컴포넌트 CSS 병합
        const finalCSS = mainCSS + '\n' + combinedComponentCSS;
        
        // CSS 파일에 저장 (Minify 처리)
        const minifiedCSS = minifyCSS(finalCSS);
        fs.writeFileSync(targetCssFile, minifiedCSS, 'utf8');
        console.log(`컴포넌트 CSS가 ${path.basename(targetCssFile)}에 병합되었습니다.`);
    }
}

/**
 * components 폴더의 SCSS 파일들만 복사하는 함수
 * 폴더 구조를 유지하면서 scss 파일만 대상 폴더에 복사합니다.
 */
function copyComponentScssFiles(source, target) {
    const sourceComponentsDir = path.join(source, 'src', 'components');
    const targetComponentsDir = path.join(target, 'src', 'components');
    
    // components 폴더가 없으면 종료
    if (!fs.existsSync(sourceComponentsDir)) {
        console.log(`components 폴더가 존재하지 않습니다: ${sourceComponentsDir}`);
        return;
    }
    
    // 대상 components 폴더 생성
    fs.mkdirSync(targetComponentsDir, { recursive: true });
    
    // 모든 컴포넌트 폴더 순회
    const componentFolders = fs.readdirSync(sourceComponentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());
    
    for (const componentFolder of componentFolders) {
        const componentName = componentFolder.name;
        const sourceComponentDir = path.join(sourceComponentsDir, componentName);
        const targetComponentDir = path.join(targetComponentsDir, componentName);
        
        // 각 컴포넌트 폴더 생성
        fs.mkdirSync(targetComponentDir, { recursive: true });
        
        // 컴포넌트 폴더 내 SCSS 파일 복사
        const scssFiles = fs.readdirSync(sourceComponentDir)
            .filter(file => file.endsWith('.scss'));
        
        for (const scssFile of scssFiles) {
            const sourcePath = path.join(sourceComponentDir, scssFile);
            const targetPath = path.join(targetComponentDir, scssFile);
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`SCSS 파일 복사: ${sourcePath} -> ${targetPath}`);
        }
        
        // scss 하위 폴더가 있는 경우 처리
        const sourceScssDir = path.join(sourceComponentDir, 'scss');
        if (fs.existsSync(sourceScssDir)) {
            const targetScssDir = path.join(targetComponentDir, 'scss');
            fs.mkdirSync(targetScssDir, { recursive: true });
            
            const nestedScssFiles = fs.readdirSync(sourceScssDir)
                .filter(file => file.endsWith('.scss'));
            
            for (const scssFile of nestedScssFiles) {
                const sourcePath = path.join(sourceScssDir, scssFile);
                const targetPath = path.join(targetScssDir, scssFile);
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`중첩 SCSS 파일 복사: ${sourcePath} -> ${targetPath}`);
            }
        }
    }
    
    console.log(`컴포넌트 SCSS 파일들이 폴더 구조에 맞게 복사되었습니다.`);
}

/**
 * component-build 실행 함수
 */
function componentBuild(folders) {
    const currentDir = process.cwd(); // 현재 실행 디렉토리
    const sampleDir = path.join(currentDir, 'sample'); // sample 폴더 경로
    const sampleSrcDir = path.join(sampleDir, 'src'); // sample/src 폴더 경로
    const mainHtmlPath = path.join(sampleSrcDir, 'main.html'); // 빌드된 main.html 경로

    // sample 폴더 확인
    if (!fs.existsSync(sampleDir)) {
        console.error(`Error: sample 폴더가 없습니다: ${sampleDir}`);
        return;
    }

    // main.html 파일 확인
    if (!fs.existsSync(mainHtmlPath)) {
        console.error(`Error: main.html 파일이 없습니다: ${mainHtmlPath}`);
        console.error(`먼저 'npm run component-dev -- sample'을 실행하여 main.html을 생성하세요.`);
        return;
    }
    
    // 컴포넌트 폴더 찾기
    const componentFolders = findComponentFolders(sampleDir);

    // 각 폴더를 생성하고 선택적으로 파일 복사
    for (const folder of folders) {
        // 기존 폴더가 있으면 삭제 (깨끗한 상태에서 시작)
        const targetDir = path.join(currentDir, folder);
        if (fs.existsSync(targetDir)) {
            console.log(`기존 폴더 삭제: ${targetDir}`);
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        
        console.log(`폴더 생성 및 복사 중: ${targetDir}`);
        
        // src 디렉토리 생성
        const targetSrcDir = path.join(targetDir, 'src');
        fs.mkdirSync(targetSrcDir, { recursive: true });
        
        // 1. assets 폴더만 복사
        copyAssetsFolder(sampleDir, targetDir);
        
        // 2. common 폴더 복사 (있는 경우)
        copyCommonFolder(sampleDir, targetDir);
        
        // 3. components 폴더의 SCSS 파일들만 폴더 구조에 맞게 복사
        copyComponentScssFiles(sampleDir, targetDir);
        
        // 4. main.html을 index.html 이름으로 대상 폴더에 복사
        const targetIndexPath = path.join(targetSrcDir, 'index.html');
        fs.copyFileSync(mainHtmlPath, targetIndexPath);
        console.log(`main.html을 index.html로 복사 완료: ${mainHtmlPath} -> ${targetIndexPath}`);
        
        // 5. 컴포넌트 SCSS를 대상 CSS 파일에 병합
        if (componentFolders.length > 0) {
            // CSS 파일 찾기 (index.html에서 링크된 CSS 파일)
            const indexContent = fs.readFileSync(targetIndexPath, 'utf8');
            const cssLinkMatch = indexContent.match(/<link[^>]*href=["']([^"']*\.css)[^>]*>/);
            
            if (cssLinkMatch && cssLinkMatch[1]) {
                // 상대 경로에서 파일 이름만 추출
                const cssRelativePath = cssLinkMatch[1].startsWith('./') 
                    ? cssLinkMatch[1].substring(2) 
                    : cssLinkMatch[1];
                    
                const targetCssPath = path.join(targetSrcDir, cssRelativePath);
                console.log(`대상 CSS 파일 찾음: ${targetCssPath}`);
                
                // CSS 디렉토리 확인
                const cssDir = path.dirname(targetCssPath);
                if (!fs.existsSync(cssDir)) {
                    fs.mkdirSync(cssDir, { recursive: true });
                    console.log(`CSS 디렉토리 생성: ${cssDir}`);
                }
                
                // 컴포넌트 SCSS 처리 및 CSS 병합
                processComponentScss(componentFolders, targetCssPath);
            } else {
                console.log(`index.html에서 CSS 파일 링크를 찾을 수 없습니다.`);
            }
        }

        console.log(`폴더 ${folder} 생성 완료: 컴포넌트가 빌드된 index.html, assets 폴더, components의 SCSS 파일, 그리고 컴포넌트 스타일이 포함된 CSS`);
    }

    console.log(`
    ╔═══════════════════════════════════════════════════════════════════════════╗
    ║                                                                           ║
    ║   ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███╗   ██╗███████╗███╗   ██╗║
    ║  ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗████╗  ██║██╔════╝████╗  ██║║
    ║  ██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║║
    ║  ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║║
    ║  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝██║ ╚████║███████╗██║ ╚████║║
    ║   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝║
    ║                                                                           ║
    ║   ██████╗ ██╗   ██╗██╗██╗     ██████╗                                    ║
    ║   ██╔══██╗██║   ██║██║██║     ██╔══██╗                                   ║
    ║   ██████╔╝██║   ██║██║██║     ██║  ██║                                   ║
    ║   ██╔══██╗██║   ██║██║██║     ██║  ██║                                   ║
    ║   ██████╔╝╚██████╔╝██║███████╗██████╔╝                                   ║
    ║   ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝                                    ║
    ║                                                                           ║
    ║   컴포넌트 합성 빌드가 완료되었습니다                                      ║
    ║                                                                           ║
    ╚═══════════════════════════════════════════════════════════════════════════╝
    `)
}

// 명령줄 인자로 폴더 이름 받기
const folders = process.argv.slice(2); // Node.js 명령어 뒤의 인자를 가져옴

if (folders.length === 0) {
    console.error('Error: 생성할 폴더 이름을 하나 이상 입력하세요.');
    console.log('Usage: node component-build.js KR UK FS');
    process.exit(1); // 종료
}

// component-build 실행
componentBuild(folders); 