---
layout: post
title: 在 QT 中使用 Cookie
categories: [技术, QT]
date: 2018-12-20
---

> 此文讲述的 Cookie 使用方法是指将 Cookie 键值对字符串通过解析构建成 `QList<QNetworkCookie>`，然后通过 `QNetworkRequest.setHeader(QNetworkRequest::CookieHeader, var)` 附加到请求的头里面发送给服务器。

### 具体使用方式

1. 解析原始 Cookie 字符串

		QList<QNetworkCookie> Request::parseCookie(const QByteArray &cookie)
		{
		    QList<QNetworkCookie> cookieList;
		    QList<QByteArray> splits = cookie.split(';');
		    foreach (QByteArray split, splits) {
		        QList<QByteArray> cookiePair = split.split('=');
		        cookieList.append(QNetworkCookie(cookiePair[0], cookiePair[1]));
		    }
		    return cookieList;
		}

2. 构建 `QVariant`

		QVariant var;
	    var.setValue(cookieList);

3. 设置头

		mNetRequest.setHeader(QNetworkRequest::CookieHeader, var);
