cmake_minimum_required(VERSION 3.22.1)

project("plant_enhancer")

# Set the OpenCV directory. The OpenCV SDK was extracted to android/opencv
# OpenCVConfig.cmake is located under android/opencv/sdk/native/jni/
set(OpenCV_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../opencv/sdk/native/jni")

find_package(OpenCV REQUIRED)

# Include OpenCV headers
include_directories(${OpenCV_INCLUDE_DIRS})

# Define the JNI shared library
add_library(plant_enhancer SHARED PlantEnhancer.cpp)

# Link OpenCV and system libraries (jnigraphics for AndroidBitmap, log for Android logging)
target_link_libraries(plant_enhancer
    ${OpenCV_LIBS}
    jnigraphics
    log
)
