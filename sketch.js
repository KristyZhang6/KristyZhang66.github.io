let score = {
  dog: 0,
  capybara: 0, // 水豚
  cat: 0,
  dolphin: 0, // 海豚
  lion: 0 // 狮子
}
let current = 0
let showResult = false
let result = ''
let history = {
  dog: 0,
  capybara: 0,
  cat: 0,
  dolphin: 0,
  lion: 0
}
let pubnub = new PubNub({
  publishKey: "pub-c-5a04c952-fab4-49cc-a35f-da33b0716cbe",
  subscribeKey: "sub-c-0b161a9d-451e-4516-af83-02d114ab0661",
  uuid: "172251af-1e8a-420c-874d-56adc64aa611"
});
let isStart = false
let online = 1
let first = true

function setup() {
  createCanvas(900, 150);
  let button = document.querySelector('.button')
  button.onclick = function () {
    initDom()
    button.style.display = 'none'
    isStart = true
  }
  initPubnub()
}

function draw() {
  background(255);
  fill('#333333')

  if (isStart) {
    // Title
    textSize(18);
    text('If you were an animal What would you be?', 26, 50)
    if (showResult) {
      // textSize(28);
      // text(result + ' type', 16, 100)
    } else {
      // Q
      textSize(28);
      text(`${current + 1}`, 26, 100)
      textSize(14);
      text('/' + topicList.length, current + 1 >= 10 ? 60 : 43, 100)
      textSize(28);
      text(topicList[current].title, current + 1 >= 10 ? 95 : 78, 100)
      fill('#ffffff')
      rect(26, 118, 834, 20)
      fill('#dedfef')
      rect(26, 118, 834 / topicList.length * (current + 1), 20)
    }
  } else {
    textSize(28);
    text('If you were an animal What would you be?', 200, 100)
  }
}

function initDom() {
  let aList = document.querySelector('.a-list')
  aList.style.display = 'block'
  let aItems = document.querySelectorAll('.a-item')
  for (let i = 0; i < aItems.length; i++) {
    aItems[i].querySelector('span').innerHTML = topicList[current].answer[i].text
    aItems[i].onclick = function () {
      topicList[current].categroy.forEach(categroy => {
        score[categroy] += topicList[current].answer[i].num
      })
      if (current + 1 == topicList.length) {
        showResult = true
        aList.style.display = 'none'

        let values = Object.values(score)
        values.sort(function (a, b) {
          return b - a
        })

        if (values[0] == values[1]) {
          result = Object.keys(score)[Math.floor(Math.random() * Object.keys(score).length)]
          console.log(result)
        } else {
          let index = Object.values(score).findIndex(val => val == values[0])
          result = Object.keys(score)[index]
        }
        history[result]++

        let resultDom = document.getElementById('result')
        resultDom.innerHTML = `
          <div>${result}</div>
        `
        resultDom.style.display = 'flex'

        pubnub.publish(
          {
            channel: "my_channel",
            message: { type: 'result', data: result }
          },
          function (status, response) {
            console.log(status);
            console.log(response);
          }
        );
        showChart()
      } else {
        current++
        aItems[0].querySelector('span').innerHTML = topicList[current].answer[0].text
        aItems[1].querySelector('span').innerHTML = topicList[current].answer[1].text
        aItems[2].querySelector('span').innerHTML = topicList[current].answer[2].text
      }
    }
  }
}

function showChart() {
  var chartDom = document.getElementById('result-chart');
  var myChart = echarts.init(chartDom);

  var option = {
    xAxis: {
      type: 'category',
      data: ['dog', 'capybara', 'cat', 'dolphin', 'lion']
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 25,
      minInterval: 5
    },
    series: [
      {
        data: [history.dog, history.capybara, history.cat, history.dolphin, history.lion],
        type: 'bar'
      }
    ]
  };

  myChart.setOption(option);

}

function initPubnub() {
  pubnub.subscribe({ channels: ["my_channel"] });

  pubnub.addListener({
    message: function (receivedMessage) {
      if (receivedMessage.message.type == 'online') {
        if (first) {
          first = false
          return false
        }
        if (receivedMessage.message.end) {
          online = receivedMessage.message.data
        } else {
          online++
          pubnub.publish(
            {
              channel: "my_channel",
              message: { type: 'online', data: online, end: true }
            },
            function (status, response) {
              console.log(status);
              console.log(response);
            }
          );
        }

        document.getElementById('online').innerHTML = 'Current online population: ' + online
      } else {
        history[receivedMessage.message.data]++
      }
    }
  });

  setTimeout(() => {
    pubnub.publish(
      {
        channel: "my_channel",
        message: { type: 'online', data: online }
      },
      function (status, response) {
        console.log(status);
        console.log(response);
      }
    );
  }, 1000);


  // pubnub.fetchMessages(
  //   {
  //     channels: ["my_channel"],
  //     end: '15343325004275466',
  //     count: 9999
  //   },
  //   function (status, response) {
  //     if (status.statusCode == 200) {
  //       history = response.channels.my_channel
  //       console.log(history);
  //     }
  //   }
  // );

}