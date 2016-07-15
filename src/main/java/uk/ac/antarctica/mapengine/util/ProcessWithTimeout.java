/*
 * Wrapper for OS processes to allow a timeout to be imposed (not needed if we're guaranteed to be on Java 8)
 */
package uk.ac.antarctica.mapengine.util;

public class ProcessWithTimeout extends Thread {

    private Process process;
    private int exitCode = Integer.MIN_VALUE;

    public ProcessWithTimeout(Process process) {
        this.process = process;
    }

    public int waitForProcess(long timeoutMilliseconds) {
        this.start();
        try {
            this.join(timeoutMilliseconds);
        } catch (InterruptedException ie) {
            this.interrupt();
        }
        return (exitCode);
    }

    @Override
    public void run() {
        try {
            exitCode = process.waitFor();
        } catch (InterruptedException ie) {
            /* Do nothing */
        } catch (Exception ex) {
            /* Unexpected exception */
        }
    }
}
