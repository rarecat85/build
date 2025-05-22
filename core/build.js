const fs = require('fs');
const path = require('path');

/**
 * 폴더 및 파일 복사 함수
 */
function copyFolderSync(source, target) {
    // 대상 폴더 생성
    fs.mkdirSync(target, { recursive: true });

    // 소스 폴더의 파일/폴더 가져오기
    const entries = fs.readdirSync(source, { withFileTypes: true });

    // 모든 파일/폴더 복사
    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            // 하위 폴더 복사
            copyFolderSync(sourcePath, targetPath);
        } else {
            // 파일 복사
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

/**
 * build 실행 함수
 */
function build(folders) {
    const currentDir = process.cwd(); // 현재 실행 디렉토리
    const sampleDir = path.join(currentDir, 'sample'); // sample 폴더 경로

    // sample 폴더 확인
    if (!fs.existsSync(sampleDir)) {
        console.error(`Error: sample 폴더가 없습니다: ${sampleDir}`);
        return;
    }

    // 각 폴더를 생성하고 파일 복사
    for (const folder of folders) {
        const targetDir = path.join(currentDir, folder); // 생성할 대상 폴더 경로
        console.log(`Creating and populating folder: ${targetDir}`);

        // 폴더 복사
        copyFolderSync(sampleDir, targetDir);
        console.log(`Folder created and populated: ${targetDir}`);
    }

    console.log(`
    ░▒▓██████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓████████▓▒░▒▓███████▓▒░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
   ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
   ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓██████▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓███████▓▒░░▒▓█▓▒░░▒▓██████▓▒░  
   ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
    ░▒▓██████▓▒░ ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                                                                                                                               
                                                                                                                               
   `)
}

// 명령줄 인자로 폴더 이름 받기
const folders = process.argv.slice(2); // Node.js 명령어 뒤의 인자를 가져옴

if (folders.length === 0) {
    console.error('Error: 생성할 폴더 이름을 하나 이상 입력하세요.');
    console.log('Usage: node build.js KR UK FS');
    process.exit(1); // 종료
}

// build 실행
build(folders);
