"""
遍历每个用户的所有照片，提取照片中的人脸，并原地存储到 photo.faces 字段中
"""

from deepface import DeepFace
from context import connect_db, photo_path, image_area_to_base64, base64_to_numpy
import logging

# 配置日志

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def new_person(collections, user_id, face_base64, confidence):
    """创建新人物"""
    result = collections["people"].insert_one({
        "user_id": user_id,
        "name": "",
        "reference_face_base64": face_base64,
        "reference_face_confidence": confidence,
    })

    logger.info(f">> 新增一个人物")

    return result.inserted_id, 0


def who_is(collections, user_id, face_base64, confidence):
    """
    从people表中寻找与传入的base64格式人脸图片匹配的人物，返回ObjectId格式的人物id
    face_base64: 要比较的人脸的base64格式图片
    confidence: 传入的人脸（face_base64）的置信度

    people 表中 person 的结构为
    {
        "_id": ObjectId("xxx"),
        "user_id": ObjectId("xxx"), # 该人物属于哪个用户
        "name": "小明",
        reference_face_base64: "xxx", # 用作参照的人物人脸，base64格式
        reference_face_confidence: 0.9, # 参照人脸的置信度
    }

    返回：
    ObjectId格式的人物id，以及两者的距离
    或者 None
    """
    min_distance = 1 # 最小的距离表示最像的人物
    person_id = None # 最像的人物的id

    for person in collections['people'].find({ "user_id": user_id }):
        result = DeepFace.verify(
            img1_path = base64_to_numpy(person.get("reference_face_base64", "")),
            img2_path = base64_to_numpy(face_base64),
            enforce_detection = False,
        )

        if result.get("verified"):
            if (result.get("distance") < min_distance):
                min_distance = result.get("distance")
                person_id = person["_id"]

            # if confidence > person.get("reference_face_confidence", 0): # 如果新人脸的置信度比原参照人脸的置信度更高
            #     # 用新的人脸替换当前人物的参照人脸
            #     collections['people'].update_one(
            #         { "_id": person["_id"] },
            #         {
            #             "$set": {
            #                 "reference_face_base64": face_base64,
            #                 "reference_face_confidence": confidence,
            #             },
            #         },
            #     )

    if (min_distance > 0.9): # 如果距离大于阈值，视为未找到相似的人脸
        person_id = None
        min_distance = None

    return person_id, min_distance


def process_user_photo(collections, user_id, photo):
    """处理用户的一张照片"""
    img_path = photo_path(photo.get("filepath_segments"))

    logger.info(f">> 正在处理照片 {img_path}")

    # 从照片中提取人脸
    extracted_faces = DeepFace.extract_faces(
        img_path = img_path,
        detector_backend = "retinaface",
        normalize_face = False,
        enforce_detection = False, # 未检测到人脸不抛出异常
    )

    # 过滤置信度小于 0.9 的人脸
    extracted_faces = [v for v in extracted_faces if v.get("confidence", 0) >= 1]

    recognized_faces = []

    for extracted_face in extracted_faces:
        # 对每个提取到的人脸，寻找对应的人物或生成新人物
        facial_area = extracted_face.get("facial_area")
        confidence = extracted_face.get("confidence")
        face_base64 = image_area_to_base64(img_path, facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"])

        person_id, distance = who_is(collections, user_id, face_base64, confidence)

        if person_id is None:
            person_id, distance = new_person(collections, user_id, face_base64, confidence)

        recognized_face = {
            "facial_area": facial_area,
            "confidence": confidence,
            "face_base64": face_base64,
            "who": person_id,
            "distance_from_who": distance,
        }

        recognized_faces.append(recognized_face)

    # 将识别到的人脸存入 photo.faces 字段
    collections["photos"].update_one(
        { "_id": photo["_id"] },
        { "$set": { "faces": recognized_faces } },
    )
    logger.info(f">> 找到 {len(recognized_faces)} 个人脸")


def main():
    """主函数，遍历所有用户"""
    collections = connect_db()

    for user in collections["users"].find():
        logger.info(f"========== 处理用户 {user['_id']} 的照片 ==========")

        for photo in collections["photos"].find({
            "user_id": user["_id"],
            "faces": { "$exists": False }, # 仅需处理尚未识别人脸的照片
        }):
            process_user_photo(collections, user["_id"], photo)


if __name__ == "__main__":
    main()
