import('dotenv').then(dotenv => dotenv.config());
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import axios from 'axios'
// import { neynar } from 'frog/hubs'
import { saveJSONToFile, readJSONFromFile, getSubmissionCount, incrementSubmissionCount } from './lib/functions.js';


export const app = new Frog({
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

app.use('/*', serveStatic({ root: './public' }))

// STEP 1 - ASK THE USER FOR THE LEGENDARY HUMAN
app.frame('/', (c) => {
  return c.res({
    action: "/step-one",
    image: ('https://github.com/jpfraneto/images/blob/main/leggendary.png?raw=true'),
    intents: [
      <TextInput placeholder="jerry garcia, steve jobs, etc." />,
      <Button value="reply">reply</Button>,
    ],
  })
})

// STEP 2 - CHECK IF ALREADY REPLIED
app.frame('/step-one', async (c) => { 
  const { buttonValue, frameData } = c
  let fid, userInput
  if(frameData){
    fid = frameData.fid
    userInput = frameData?.inputText || ""
  }
  const thisUserData = readJSONFromFile(fid)
  if(thisUserData) {
    return c.res({
      image: (
        <div
              style={{
                    alignItems: 'center',
                    background:'linear-gradient(to right, #432889, #17101F)',
                    backgroundSize: '100% 100%',
                    display: 'flex',
                    flexDirection: 'column',
                    flexWrap: 'nowrap',
                    height: '100%',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                  }}>
                  <div
          style={{
            color: 'white',
            fontSize: 50,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1,
            display: "flex",
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
               come on, you already voted for {thisUserData.chosenHuman}, but you can share this frame with your friends for them to choose theirs 👇🏽
        </div>

        </div>
      ),
      intents: [
        <Button.Link href="https://warpcast.com/~/compose?text=choose%20the%20most%20legendary%20human%20of%20our%20time%20on%20the%20frame%20below%20%F0%9F%91%87%F0%9F%8F%BD%20%28credits%3A%20%40jpfraneto%29&embeds[]=https://bangercaster.xyz/api
        ">share frame</Button.Link>,
      ],
    })
  } else {
    if(!frameData?.inputText || frameData?.inputText.length < 8 ){
      return c.res({
        image: (

          <div
          style={{
                alignItems: 'center',
                background:'linear-gradient(to right, #432889, #17101F)',
                backgroundSize: '100% 100%',
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'nowrap',
                height: '100%',
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%',
              }}>
              <div
      style={{
        color: 'white',
        fontSize: 50,
        fontStyle: 'normal',
        letterSpacing: '-0.025em',
        lineHeight: 1,
        display: "flex",
        marginTop: 30,
        padding: '0 120px',
        whiteSpace: 'pre-wrap',
      }}
    >
             enter a valid name
    </div>
    </div>
        ),
        intents: [
          <TextInput placeholder="ricky martin, cristiano ronaldo, etc." />,
          <Button value="reply">try again</Button>,
        ],
      })
    }
    let poiesisResponse = await axios.post('https://poiesis.anky.bot/legendary', {userInput} ,{
      headers: {
        'Authorization': `Bearer ${process.env.POIESIS_API_KEY}`
      }
    });
    console.log("the response from poiesis is", poiesisResponse)
    if(poiesisResponse?.data?.isLegendary){
      const dataToSave = {
        chosenHuman: userInput,
        isLegendary: poiesisResponse?.data.isLegendary,
        legendaryness: poiesisResponse?.data.legendaryness,
        replyToUser: poiesisResponse?.data.replyToUser,
        fid: fid
      }
      saveJSONToFile(fid, dataToSave)
      const newCount = incrementSubmissionCount()
      const usernameResponse = await axios.get(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}&viewer_fid=16098`,
        {
          headers: {
            api_key: process.env.NEYNAR_API_KEY,
          },
        }
      );
      let castText = `@${usernameResponse.data.users[0].username} - ${userInput}\n\n${dataToSave.replyToUser}`
      let castOptions = {
        text: castText,
        signer_uuid: process.env.ANKYSYNC_SIGNER,
        parent: rootCastHash
      };
      const neynarResponse = axios.post(
        "https://api.neynar.com/v2/farcaster/cast",
        castOptions,
        {
          headers: {
            api_key: process.env.NEYNAR_API_KEY,
          },
        }
      );
      return c.res({
        image: (

          <div
          style={{
                alignItems: 'center',
                background:'linear-gradient(to right, #432889, #17101F)',
                backgroundSize: '100% 100%',
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'nowrap',
                height: '100%',
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%',
              }}>
              <div
      style={{
        color: 'white',
        fontSize: 50,
        fontStyle: 'normal',
        letterSpacing: '-0.025em',
        lineHeight: 1,
        display: "flex",
        marginTop: 30,
        padding: '0 120px',
        whiteSpace: 'pre-wrap',
      }}
    >
             {dataToSave.replyToUser}
    </div>
    <div
      style={{
        color: 'orange',
        fontSize: 40,
        fontStyle: 'normal',
        letterSpacing: '-0.025em',
        lineHeight: 1,
        display: "flex",
        marginTop: 30,
        padding: '0 120px',
        whiteSpace: 'pre-wrap',
      }}
    >
             (your choice was commented below the first cast where this frame was shared)
    </div>

    </div>
        ),
        intents: [
          <Button.Link href={`https://warpcast.com/jpfraneto/${rootCastHash.slice(0,10)}`}>read comments</Button.Link>,
          <Button.Link href="https://warpcast.com/~/compose?text=choose%20the%20most%20legendary%20human%20of%20our%20time%20on%20the%20frame%20below%20%F0%9F%91%87%F0%9F%8F%BD%20%28credits%3A%20%40jpfraneto%29&embeds[]=https://bangercaster.xyz/api
          ">share frame</Button.Link>,
        ],
      })
    } else {
      return c.res({
        image: (
<div
style={{
      alignItems: 'center',
      background:'linear-gradient(to right, #432889, #17101F)',
      backgroundSize: '100% 100%',
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      height: '100%',
      justifyContent: 'center',
      textAlign: 'center',
      width: '100%',
    }}>
    <div
style={{
color: 'white',
fontSize: 50,
fontStyle: 'normal',
letterSpacing: '-0.025em',
lineHeight: 1,
display: "flex",
marginTop: 30,
padding: '0 120px',
whiteSpace: 'pre-wrap',
}}
>
{`${userInput} is not a legendary human. please try again`}
</div>

</div>
        ),
        intents: [
          <TextInput placeholder="ricky martin, cristiano ronaldo, etc." />,
          <Button value="reply">try again</Button>,
        ],
      })
    }
  }
})

// app.frame('/', (c) => {
//   const { buttonValue, inputText, status } = c
//   const fruit = inputText || buttonValue
//   return c.res({
//     image: (
//       <div
//         style={{
//           alignItems: 'center',
//           background:
//             status === 'response'
//               ? 'linear-gradient(to right, #432889, #17101F)'
//               : 'black',
//           backgroundSize: '100% 100%',
//           display: 'flex',
//           flexDirection: 'column',
//           flexWrap: 'nowrap',
//           height: '100%',
//           justifyContent: 'center',
//           textAlign: 'center',
//           width: '100%',
//         }}
//       >
//         <div
//           style={{
//             color: 'white',
//             fontSize: 60,
//             fontStyle: 'normal',
//             letterSpacing: '-0.025em',
//             lineHeight: 1.4,
//             marginTop: 30,
//             padding: '0 120px',
//             whiteSpace: 'pre-wrap',
//           }}
//         >
//           {status === 'response'
//             ? `Nice choice.${fruit ? ` ${fruit.toUpperCase()}!!` : ''}`
//             : 'Welcome!'}
//         </div>
//       </div>
//     ),
//     intents: [
//       <TextInput placeholder="Enter custom fruit..." />,
//       <Button value="apples">Apples</Button>,
//       <Button value="oranges">Oranges</Button>,
//       <Button value="bananas">Bananas</Button>,
//       status === 'response' && <Button.Reset>Reset</Button.Reset>,
//     ],
//   })
// })

const port = 3000
console.log(`Server is running on port ${port}`)

devtools(app, { serveStatic })

serve({
  fetch: app.fetch,
  port,
})
