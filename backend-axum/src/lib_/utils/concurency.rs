use std::fmt::Display;
use std::sync::Arc;
use tokio::sync::Semaphore;
use tokio::task::{JoinError, JoinSet};

#[derive(Debug)]
pub enum BatchError<T> {
    Panic(JoinError),
    TransformFailed(Vec<(usize, T)>),
}

impl<T: Display> Display for BatchError<T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BatchError::Panic(e) => write!(f, "task panicked: {e}"),
            BatchError::TransformFailed(errs) => {
                writeln!(f, "batch processing failed:")?;
                for (i, e) in errs {
                    writeln!(f, "  [{i}]: {e}")?;
                }
                Ok(())
            }
        }
    }
}

impl<T: std::error::Error> std::error::Error for BatchError<T> {}

pub async fn batch_process<Input, Output, Error, Callback, Fut>(
    batch: Vec<Input>,
    transform: Callback,
    max_workers: usize,
) -> Result<Vec<Output>, BatchError<Error>>
where
    Input: Send + 'static,
    Output: Send + 'static,
    Error: Send + 'static,
    Callback: Fn(Input) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<Output, Error>> + Send,
{
    let length = batch.len();
    let transform = Arc::new(transform);
    let semaphore = Arc::new(Semaphore::new(max_workers));
    let mut join_set = JoinSet::new();

    for (i, item) in batch.into_iter().enumerate() {
        let semaphore = semaphore.clone();
        let transform = transform.clone();
        join_set.spawn(async move {
            let _worker_spot = semaphore
                .acquire()
                .await
                .expect("semaphaore was unexpectedly closed");
            let task_result = transform(item).await;
            (i, task_result)
        });
    }

    let mut results: Vec<Option<Output>> = (0..length).map(|_| None).collect();
    let mut errors: Vec<(usize, Error)> = Vec::new();

    while let Some(res) = join_set.join_next().await {
        match res {
            Ok((i, Ok(val))) => results[i] = Some(val),
            Ok((i, Err(e))) => errors.push((i, e)),
            Err(err) => return Err(BatchError::Panic(err)),
        }
    }

    if !errors.is_empty() {
        return Err(BatchError::TransformFailed(errors));
    }

    Ok(results.into_iter().flatten().collect())
}
