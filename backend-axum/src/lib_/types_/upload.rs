use std::fmt;

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
