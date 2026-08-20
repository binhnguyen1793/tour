02052018
pkill -f "Google Chrome"

ps aux | grep Chrome

mkdir -p "/tmp/chrome-bot"

cp -R "/Users/mac/Library/Application Support/Google/Chrome/Profile 4" "/tmp/chrome-bot/Profile_BOT"

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-bot" \
  --profile-directory="Profile_BOT"

lsof -n -i:9222

Google Chrome   PID   LISTEN ...:9222

http://localhost:9222/json/version

pkill -f "Google Chrome"
pkill -f chromedriver


/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version


chromedriver --version

which chromedriver
# ví dụ: /usr/local/bin/chromedriver

rm -f /usr/local/bin/chromedriver

rm -f ~/chrome-bot-profile/SingletonLock
rm -f ~/chrome-bot-profile/SingletonCookie
rm -f ~/chrome-bot-profile/SingletonSocket
rm -f ~/chrome-bot-profile/Singleton*


/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --user-data-dir="$HOME/chrome-bot-profile" \
  --profile-directory=Default

pkill -f chromedriver
rm -rf ~/.cache/selenium
rm -rf ~/Library/Caches/selenium
rm -f /usr/local/bin/chromedriver
rm -f /opt/homebrew/bin/chromedriver

