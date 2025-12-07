#[derive(Debug, Clone)]
pub struct FileToUpload {
    pub originalname: String,
    pub mimetype: String,
    pub data: Vec<u8>,
}
