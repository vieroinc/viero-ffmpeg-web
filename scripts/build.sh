# This script is not yet ready, do not use!
# The below is just notes for us.
echo 'THIS SCRIPT IS STILL WORK IN PROGRESS. QUITTING!'
exit 0

# 1 make build directory
mkdir -p build
cd build

# 2 clone FFmpeg
# CLONE git clone https://github.com/FFmpeg/FFmpeg.git
cd FFmpeg

# 3 checkout tag
git checkout n4.3.1

# 4 apply patches
# PATCH

# 5 configure
emconfigure ./configure --disable-doc --disable-asm --disable-programs --enable-ffmpeg --disable-network --disable-hwaccels --disable-sdl2 --disable-pthreads \
--enable-cross-compile --disable-runtime-cpudetect --disable-stripping  --disable-fast-unaligned --enable-pic \
--cc=emcc \
--nm=$EMSDK/fastcomp/fastcomp/bin/llvm-nm -g \
--ar=emar \
--cc=emcc \
--cxx=em++ \
--objcc=emcc \
--dep-cc=emcc

# 6 make
emmake make -j4

# 7 build wasm and js
emcc \
-Llibavcodec -Llibavdevice -Llibavfilter -Llibavformat -Llibavresample -Llibavutil -Llibpostproc -Llibswscale -Llibswresample \
-Qunused-arguments -O2 \
-o ffmpeg.js \
fftools/ffmpeg_opt.o fftools/ffmpeg_filter.o fftools/ffmpeg_hw.o fftools/cmdutils.o fftools/ffmpeg.o \
-lavdevice -lavfilter -lavformat -lavcodec -lswresample -lswscale -lavutil -lm \
-s MODULARIZE=1 \
-s EXPORTED_FUNCTIONS="[_ffmpeg]" \
-s EXTRA_EXPORTED_RUNTIME_METHODS="[cwrap, FS, getValue, setValue]" \
-s TOTAL_MEMORY=67108864 \
-s ALLOW_MEMORY_GROWTH=1 \
-s SAFE_HEAP=1 \
-lidbfs.js \
--pre-js ../../res/pre.js

# 8 settle wasm and js files
