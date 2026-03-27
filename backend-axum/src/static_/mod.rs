pub fn get_image_path(path: impl ToString) -> String {
    format!("/app/src/static_/images/{}", path.to_string())
}
