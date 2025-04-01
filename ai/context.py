"""
一些工具函数，但是特定于当前项目的上下文
"""

import os
import cv2
import base64
import numpy as np
from pymongo import MongoClient


def connect_db():
    """连接到 MongoDB 数据库"""
    client = MongoClient("mongodb://localhost:27017/")
    db = client["finalproject"]
    return {
        "users": db["users"],
        "photos": db["photos"],
        "people": db["people"],
    }


def photo_path(filepath_segments = []):
    BASE_PATH = r"C:\Users\wesle\AppData\Local\QiuYuTingFinalProject\uploads" # 照片的基础路径
    return os.path.join(BASE_PATH, *filepath_segments)


def image_area_to_base64(image_path, x, y, w, h, target_width = 112):
    """
    从原始图片裁剪指定区域（facial_area），并转换为 Base64 编码的 JPEG
    """

    # 读取原图（BGR 格式）
    image = cv2.imread(image_path)

    # 裁剪指定区域
    image = image[y:y+h, x:x+w]

    # 按指定目标宽度调整大小
    new_h = int(target_width * (h / w))
    image = cv2.resize(image, (target_width, new_h), interpolation=cv2.INTER_AREA)

    # 编码为 JPEG 并转换为 Base64
    _, buffer = cv2.imencode('.jpg', image)
    base64_str = base64.b64encode(buffer).decode("utf-8")

    return base64_str


def base64_to_numpy(base64_str: str) -> np.ndarray:
    """将 base64 编码的图像字符串转换为 NumPy 数组"""
    img_data = base64.b64decode(base64_str)
    img_array = np.frombuffer(img_data, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)  # 转换为图像（BGR格式）
    return img
