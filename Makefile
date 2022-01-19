
TARGET_NAME=armawebtron

TARGET_SERVER = $(TARGET_NAME)-server

ifeq ($(TARGET),)
	TARGET=$(TARGET_NAME)
endif

ifeq ($(PLATFORM),)
	PLATFORM=node14-linux
endif





all: $(TARGET)

run: all
	./$(TARGET)


server: $(TARGET_SERVER)
dedicated: server



$(TARGET_SERVER): server.js
	pkg -t $(PLATFORM) server.js --compress GZip -o $(TARGET_SERVER)

$(TARGET_NAME): electron.js
	


