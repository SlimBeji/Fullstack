from lib.utils import StrEnum


class ContentType(StrEnum):
    Multipart_Form_Data = "multipart/form-data"
    Application_Json = "application/json"


class MimeType(StrEnum):
    JPEG = "image/jpeg"
    PNG = "image/png"
