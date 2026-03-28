use std::{fmt, fs, io, path};

use mime_guess::MimeGuess;

#[derive(Clone)]
pub struct FileToUpload {
    pub originalname: String,
    pub mimetype: String,
    pub data: Vec<u8>,
}

impl fmt::Debug for FileToUpload {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("FileToUpload")
            .field("originalname", &self.originalname)
            .field("mimetype", &self.mimetype)
            .finish()
    }
}

impl FileToUpload {
    pub fn from_path(path: &str) -> Result<Self, io::Error> {
        let data = fs::read(path)?;
        let originalname = path::Path::new(&path)
            .file_name()
            .map(|v| v.to_string_lossy().to_string())
            .unwrap_or("file".to_string());
        let mimetype = MimeGuess::from_path(path)
            .first_or_octet_stream()
            .essence_str()
            .to_string();
        Ok(Self {
            originalname,
            mimetype,
            data,
        })
    }
}
