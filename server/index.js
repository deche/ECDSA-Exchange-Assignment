const express = require('express');
const app = express();
const cors = require('cors');
var EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const port = 3042;
const ec = new EC('secp256k1');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {}

let i = 0;
while (i < 3) {
  let key = ec.genKeyPair();
  let publicKey = key.getPublic().encode('hex');
  console.log(`publicKey ${i}: ${publicKey}` );
  let privateKey = key.getPrivate().toString(16);
  console.log(`privateKey ${i}: ${privateKey}`);
  console.log(`X ${i}: ${key.getPublic().getX().toString('hex')}`)
  console.log(`Y ${i}: ${key.getPublic().getY().toString('hex')}`)

  balances[publicKey] = 100 - i*25;

  i++;
}

console.log(balances);

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount, signatureR, signatureS} = req.body;

  // verify
  const key = ec.keyFromPublic(sender, 'hex');
  const msg = `${amount} - ${recipient}`;
  const msgHash = SHA256(msg).toString();

  const signature = {
    r: signatureR,
    s: signatureS
  };

  if(key.verify(msgHash, signature)) {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
  }

  res.send({ balance: balances[sender] });

});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
