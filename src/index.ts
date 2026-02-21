import express from 'express';
import userRoutes from './routes/user';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vulnerabilidad: Secreto hardcodeado (Secret Scanning target)
const API_SECRET_TOKEN = 'AKIAIOSFODNN7EXAMPLE';
console.log(`Using secret token: ${API_SECRET_TOKEN}`);

app.get('/', (req, res) => {
  res.send('MoonSec Vulnerable API - AppSec Interview Project');
});

app.use('/users', userRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
