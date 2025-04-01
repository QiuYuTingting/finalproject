# finalproject-ai

毕业设计的人工智能模块。

主要操作有：

- 遍历用户和用户照片，提取照片中的人脸，并识别人物。

## 关于项目

人脸识别和比对等操作使用 [deepface](https://github.com/serengil/deepface) 库完成。

### 安装

- 要求 python 版本必须为 Python 3.10.xx

> 在 windows 上，可以并行安装多个 python 版本；然后使用 `py -3.10` 命令（而不是常规的 `python`）命令可强制使用特定版本。py 是新版本 python 附带的一个软件。

```bash
$ python -V # 需要把 python 安装路径添加到环境变量
Python 3.13.2 # 这个输出表示当前系统中多个版本中的最新版是 3.13.2，默认将会使用此版本的 python 执行命令

$ py -V
Python 3.13.2 # 同上

$ py -3.10 -V
Python 3.10.10 # 使用了特定的 3.10.xx 版本
```

- 在当前目录下，执行 `py -3.10 -m venv venv` （将会生成 venv 文件夹）

> 命令中第二个 venv 是文件夹名称，可以换成别的。如果换成别的，则要同步更改下面的命令中出现的 venv！

- 观察文件管理器，看当前位置是否有 venv 文件夹，有则进行下一步

- 在终端执行 `. /venv/Scripts/activate` 进入虚拟环境（命令中第一个点号表示可执行文件，不能省略）

> 如果是 powershell 则执行 `. .\venv\Scripts\activate`

- 观察终端，是否有 venv 字样，例如：

```
# 在 powershell 中
PS C:\Users\qiuyuting\Documents\Projects\finalproject-backend\ai> . .\venv\Scripts\activate
(venv) PS C:\Users\qiuyuting\Documents\Projects\finalproject-backend\ai>

# 或者在 bash 中
$ . venv/Scripts/activate
(venv)
```

- 确认在 venv 中后，执行 `python -V` 确认版本是否正确，要求 3.10.xx

> 留意：进入 venv 后，windows平台也无需在使用 py 命令，直接使用 python 即可。

```bash
$ python -V
Python 3.10.10
(venv)
```

```
# powershell
(venv) PS C:\Users\qiuyuting\Documents\Projects\finalproject-backend\ai> python -V
Python 3.10.10
```

- 确认版本无误后，运行 `pip install deepface` 安装核心的 deepface 库及其相关依赖

- 继续使用 pip 安装其它必须的库，目前有 `pymongo` 和 `tf_keras` 两个库还需单独安装；其余库要么是 python 内置库，要么已经作为 deepface 的依赖安装完毕

> 具体以项目中使用到的库为准；也可以等执行脚本时出现报错再去安装

- 完成后，可以使用 `deactivate` 退出虚拟环境
