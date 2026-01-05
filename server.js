require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT
