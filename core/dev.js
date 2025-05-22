const path = require('path');
const sass = require('sass');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
const CleanCSS = require('clean-css'); // CSS Minify를 위한 라이브러리

// SCSS 파일의 해시값 저장 객체
const fileHashes = {};

// SCSS 파일 종속성 맵
const dependencyMap = {};

/**
 * SCSS 파일 해시 생성
 */
function generateFileHash(filePath) {
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
    } catch (error) {
        console.error(`${filePath} 변환 중 오류 발생:`, error);
    }
}

/**
 * 종속성 맵 업데이트
 */
function updateDependencyMap(scssDir) {
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

    console.log('종속성 맵 업데이트 완료:', dependencyMap);
}

/**
 * SCSS 파일 업데이트 확인 및 컴파일
 */
function checkAndCompileSCSS(filePath, cssDir) {
    const newHash = generateFileHash(filePath);

    if (fileHashes[filePath] !== newHash) {
        fileHashes[filePath] = newHash; // 새로운 해시값 저장
        console.log(`${filePath} 내용 변경 감지!`);

        // `_`로 시작하는 파일인지 확인
        if (path.basename(filePath).startsWith('_')) {
            console.log(`"${filePath}"는 컴파일 대상이 아니지만, 종속된 파일을 다시 컴파일합니다.`);

            // `_` 파일을 참조하는 파일들을 컴파일
            if (dependencyMap[filePath]) {
                dependencyMap[filePath].forEach(mainFile => {
                    compileSCSS(mainFile, cssDir);
                });
            }
        } else {
            // 메인 파일 자체를 컴파일
            compileSCSS(filePath, cssDir);
        }
    } else {
        console.log(`${filePath} 내용 변경 없음, 변환 스킵.`);
    }
}

/**
 * SCSS 폴더 내 모든 파일 컴파일
 */
function compileAllSCSS(scssDir, cssDir) {
    const scssFiles = fs.readdirSync(scssDir).filter(file => {
        // `_`로 시작하는 파일 제외 (직접 변환되지 않음)
        return file.endsWith('.scss') && !file.startsWith('_');
    });

    if (!scssFiles.length) {
        console.log('변환할 SCSS 파일이 없습니다.');
        return;
    }

    scssFiles.forEach(file => {
        const filePath = path.join(scssDir, file);

        // 초기 해시값 저장
        fileHashes[filePath] = generateFileHash(filePath);

        // 파일 컴파일
        compileSCSS(filePath, cssDir);
    });
}

/**
 * 개발 서버 실행
 */
function startServer(folderName, scssDir, cssDir) {
    const currentDir = process.cwd();
    const targetDir = path.join(currentDir, folderName); // 상위 폴더를 루트로 설정
    const indexFile = path.join(targetDir, 'src/index.html');

    if (!fs.existsSync(indexFile)) {
        console.error(`Error: index.html 파일이 없습니다: ${indexFile}`);
        return;
    }

    console.log(`Starting server for ${indexFile}`);

    exec(`npx live-server ${targetDir} --open=src/index.html --wait=10`, (error, stdout, stderr) => {
        if (error) {
            console.error(`서버 실행 중 오류 발생: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`서버 오류 메시지: ${stderr}`);
        }
        console.log(stdout);
    });

    // SCSS 파일 변경 감지
    fs.watch(scssDir, (eventType, filename) => {
      if (filename && eventType === 'change') {
          console.log(`${filename} 파일 변경 감지!`);
          const filePath = path.join(scssDir, filename);
          checkAndCompileSCSS(filePath, cssDir);
      }
  });
}


/**
 * dev 실행
 */
function dev() {
    const folderName = process.argv[2]; // 명령줄 인자로 하위 폴더명 받기
    if (!folderName) {
        console.error('Error: 실행할 하위 폴더명을 입력하세요.');
        console.log('Usage: node dev.js <folderName>');
        process.exit(1);
    }

    const currentDir = process.cwd();
    const scssDir = path.join(currentDir, folderName, 'src/assets/scss');
    const cssDir = path.join(currentDir, folderName, 'src/assets/css');

    if (!fs.existsSync(scssDir)) {
        console.error(`SCSS 폴더가 없습니다: ${scssDir}`);
        return;
    }

    fs.mkdirSync(cssDir, { recursive: true });

    // 종속성 맵 업데이트
    updateDependencyMap(scssDir);

    // 초기 SCSS 파일 변환 및 해시값 저장
    compileAllSCSS(scssDir, cssDir);

    // 개발 서버 시작 및 SCSS 감지
    startServer(folderName, scssDir, cssDir);

    console.log(`
        ░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░░▒▓████████▓▒░▒▓██████▓▒░ ░▒▓██████▓▒░▒▓████████▓▒░ 
        ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
        ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
        ░▒▓███████▓▒░░▒▓████████▓▒░▒▓███████▓▒░░▒▓██████▓▒░░▒▓█▓▒░      ░▒▓████████▓▒░ ░▒▓█▓▒░     
        ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
        ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
        ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
                                                                                                   
                                                                                                   
        `)
}

dev();
