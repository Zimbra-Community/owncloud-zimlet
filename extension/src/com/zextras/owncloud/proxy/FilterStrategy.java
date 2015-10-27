package com.zextras.owncloud.proxy;

import javax.servlet.ServletOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

interface FilterStrategy
{
  void filter(
    ByteArrayOutputStream byteArrayOutputStream,
    ServletOutputStream outputStream
  ) throws IOException;
}
