package com.zextras.owncloud.proxy;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

class FilterServletOutputStream extends ServletOutputStream
{
  final private ServletOutputStream servletOutputStream;
  private final FilterStrategy strategy;
  final private ByteArrayOutputStream byteArrayOutputStream;

  public FilterServletOutputStream(ServletOutputStream servletOutputStream, FilterStrategy strategy)
  {
    this.servletOutputStream = servletOutputStream;
    this.strategy = strategy;
    byteArrayOutputStream = new ByteArrayOutputStream(4096);
  }

  @Override
  public void setWriteListener(WriteListener writeListener)
  {
    servletOutputStream.setWriteListener(writeListener);
  }

  @Override
  public boolean isReady()
  {
    return servletOutputStream.isReady();
  }

  @Override
  public void write(int b) throws IOException
  {
    byteArrayOutputStream.write(b);
  }

  @Override
  public void write(byte b[]) throws IOException
  {
    byteArrayOutputStream.write(b);
  }

  @Override
  public void write(byte[] b, int off, int len) throws IOException
  {
    byteArrayOutputStream.write(b, off, len);
  }

  public void filterAndFlush() throws IOException
  {
    strategy.filter(byteArrayOutputStream, servletOutputStream);
  }

  @Override
  public void close() throws IOException
  {
    filterAndFlush();
    servletOutputStream.close();
    byteArrayOutputStream.close();
  }
}
