# Billing WxNimi

A personal finance management application developed based on WeChat Mini Program.

## Online Demo

![Online Demo](images/在线体验.jpg)


## Related Repositories

- **WeChat Mini Program**: This repository
- **Backend**: [https://github.com/chao69782/billing_java.git](https://github.com/chao69782/billing_java.git)

## Features

### 📊 Expense Management
- **Expense Logging**: Quickly record daily income and expenses
- **Ledger Management**: Support for multiple ledgers
- **Bill Details**: View detailed information for each transaction

### 📈 Data Visualization
- **Chart Statistics**: Intuitive charts displaying income and expense trends
- **Data Summaries**: Monthly/daily summaries of income and expenses

### 🧮 Practical Tools
- **Calculator**: Built-in calculator functionality
- **Smart Assistant**: Provides financial advice and reminders

### 👨‍👩‍👧 Family Features
- **Family Ledger**: Supports collaborative bookkeeping among family members
- **Data Sharing**: Share financial records among family members

### 💬 Feedback & Suggestions
- **Feedback Submission**: Submit usage issues and suggestions
  
## UI Preview

<table>
  <tr>
    <td align="center">
      <img src="images/记账.png" width="200" alt="Bookkeeping"/>
      <br/>Bookkeeping
    </td>
    <td align="center">
      <img src="images/记账记录.png" width="200" alt="Record List"/>
      <br/>Record List
    </td>
    <td align="center">
      <img src="images/结余汇总.png" width="200" alt="Balance Summary"/>
      <br/>Balance Summary
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/图表统计1.png" width="200" alt="Chart Statistics 1"/>
      <br/>Chart Statistics 1
    </td>
    <td align="center">
      <img src="images/图标统计2.png" width="200" alt="Chart Statistics 2"/>
      <br/>Chart Statistics 2
    </td>
    <td align="center">
      <img src="images/发现.png" width="200" alt="Discovery"/>
      <br/>Discovery
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/AI助手.jpg" width="200" alt="AI Assistant"/>
      <br/>AI Assistant
    </td>
    <td align="center">
      <img src="images/家庭记账.png" width="200" alt="Family Bookkeeping"/>
      <br/>Family Bookkeeping
    </td>
    <td align="center">
      <img src="images/我的.png" width="200" alt="Profile"/>
      <br/>Profile
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/分类设置.png" width="200" alt="Category Settings"/>
      <br/>Category Settings
    </td>
    <td align="center">
      <img src="images/自定义分类.png" width="200" alt="Custom Category"/>
      <br/>Custom Category
    </td>
    <td align="center">
    </td>
  </tr>
</table>

## Project Structure

```
├── app.js              # Application entry file
├── app.json            # Application configuration
├── app.wxss            # Global styles
├── components/         # Common components
│   ├── amount-editor/      # Amount editor
│   ├── category-picker/    # Category picker
│   ├── navigation-bar/     # Navigation bar
│   └── custom-tab-bar/     # Custom tabBar
├── pages/              # Page files
│   ├── assistant/      # Smart Assistant
│   ├── bill-detail/    # Bill Detail
│   ├── calculator/     # Calculator
│   ├── charts/         # Chart Statistics
│   ├── discovery/      # Discovery
│   ├── family/         # Family
│   ├── feedback/       # Feedback
│   ├── ledger/         # Ledger Management
│   ├── mine/           # Mine
│   └── record/         # Expense Recording
├── utils/              # Utility modules
│   ├── date.js         # Date processing utilities
│   └── request.js      # Network request wrapper
└── assets/             # Static assets
```

## Technology Stack

- **Framework**: Native WeChat Mini Program development
- **Styling**: WXML + WXSS
- **Network Requests**: Custom request module wrapper
- **Data Storage**: Local storage (wx.setStorage)

## Quick Start

### Prerequisites
- WeChat Developer Tool
- WeChat Mini Program AppID

### Installation Steps

1. Clone the project locally:
```bash
git clone https://gitee.com/zhang-lichao/billing_mini.git
```

2. Open the project directory using the WeChat Developer Tool

3. Preview the project within the WeChat Developer Tool

## Usage Guide

### First-Time Setup
1. After opening the mini program, set up your user information on the "Mine" page
2. Start recording your first income or expense

### Recording Process
1. Navigate to the "Record" page
2. Select income/expense type, category, and amount
3. Add a note (optional)
4. Save the record

### Viewing Statistics
1. Go to the "Charts" page to view income and expense distribution
2. Filter data by month

## API Reference

### Network Request Wrapper (utils/request.js)

```javascript
// GET request
GET(url, data, timeout)

// POST request
POST(url, data, timeout, useFormdata)

// PUT request
PUT(url, data, timeout, useFormdata)

// DELETE request
DEL(url, data, timeout, useFormdata)
```

### Date Utilities (utils/date.js)

```javascript
// Format date
formatDate(isoStr)

// Zero-pad number
pad(n)

// Format display date
formatDisplayDate(isoStr)

// Format time
formatTime(isoStr)

// Group records by date
groupRecordsByDate(records)

// Get monthly summary
getMonthSummary(records, year, month)
```

## Contribution Guidelines

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## License

This project is intended solely for learning and communication purposes.

## Contact Me

<div align="center">
  <img src="images/联系我.jpg" width="300" alt="Contact Me"/>
  <br/>
  <p>Scan the QR code above to add me as a friend.</p>
</div>