const fs = require('fs');
const path = require('path');

const typeMapping = {
  DWORD: 'uint32_t',
  WORD: 'uint16_t',
  BYTE: 'uint8_t',
  IDENT: 'uint32_t',
  'unsigned long long': 'uint32_t',
  'long long int': 'int64_t',
  'signed long long': 'int64_t',
  'long long': 'int64_t',
  'unsigned long': 'uint32_t',
  'long int': 'int32_t',
  long: 'int32_t',
  'short int': 'uint16_t',
  'unsigned short': 'uint16_t',
  short: 'uint16_t',
  'unsigned char': 'uint8_t',
  time_t: 'int32_t',
  size_t: 'uint32_t',
  'unsigned int': 'uint32_t',
  INT: 'int32_t',
  int: 'int32_t',
  uint: 'uint32_t',
  signed: 'int32_t',
  unsigned: 'uint32_t',
  'signed char': 'char',
};

const replaceTypes = (filePath, inputRoot, outputRoot) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  const where = filePath.split(`\\`);
  const folder = where[where.length - 3] || 'unknown';
  const filename = where[where.length - 1] || 'unknown';

  for (const [unopt, opt] of Object.entries(typeMapping)) {
    const regex = new RegExp(`\\b${unopt}\\b`, 'g');
    const match = modified.match(regex);

    if (match) {
      console.log('Replaced', unopt, 'with', opt, 'in', `${folder}/${filename}`);
    }

    modified = modified.replace(regex, opt);
  }

  const relativePath = path.relative(inputRoot, filePath);
  const outputFilePath = path.join(outputRoot, relativePath);

  // Ensure the directory structure is created in the output directory
  createDirectoryIfNotExists(path.dirname(outputFilePath));

  fs.writeFileSync(outputFilePath, modified, 'utf-8');
};

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fileList.push({ type: 'directory', path: filePath });
      getAllFiles(filePath, fileList);
    } else {
      fileList.push({ type: 'file', path: filePath });
    }
  });

  return fileList;
}

function createDirectoryIfNotExists(dir) {
  const parts = dir.split(path.sep);

  for (let i = 1; i <= parts.length; i++) {
    const currentPath = path.join(...parts.slice(0, i));

    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
      console.log(`Created directory: ${currentPath}`);
    }
  }
}

/// bootstrap
const supportedExtensions = ['cpp', 'h', 'hpp'];
const output = `${__dirname}/changed`;
const outputLen = output.split('/').length;
const input = `${__dirname}`;

function bootstrap() {
  // create folder for changed files
  createDirectoryIfNotExists(output);

  // list all files and directories
  let files = getAllFiles(input);

  files.filter(file => {
    if (file.type === 'folder' && file.path.includes(output.split('/')[outputLen - 1])) return;

    if (file.type === 'file') {
      // ignore some stufff
      if (file.path.includes('Makefile') || file.path.includes('replacer'))
        return;

      // extension
      const [ _, ext ] = file.path.split('.');

      if (supportedExtensions.includes(ext)) {
        // replace and move it to output
        replaceTypes(file.path, input, output);
      }
    }
  })
}

bootstrap();